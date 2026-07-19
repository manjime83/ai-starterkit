"use server";

import { ActionError, authActionClient } from "@/lib/safe-action";
import { deleteFile, getPresignedDownloadUrl, getPresignedUploadUrl, headFile } from "@/lib/storage";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import * as data from "./data";
import {
  attachmentContentTypes,
  createTodoSchema,
  deleteTodoSchema,
  getDownloadUrlSchema,
  getUploadUrlSchema,
  MAX_ATTACHMENT_BYTES,
  toggleTodoSchema,
} from "./schemas";

export const getUploadUrl = authActionClient
  .inputSchema(getUploadUrlSchema)
  .action(async ({ parsedInput: { filename, contentType, size }, ctx }) => {
    // The client never dictates the key: the user-id prefix makes cross-user overwrites
    // impossible by construction, and createId() prevents self-overwrites.
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const key = `${ctx.user.id}/${createId()}/${safeName}`;
    const contentDisposition = `attachment; filename="${safeName}"`;

    const url = await getPresignedUploadUrl({
      key,
      contentType,
      contentLength: size,
      contentDisposition,
    });

    return {
      key,
      url,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    };
  });

export const createTodo = authActionClient
  .inputSchema(createTodoSchema)
  .action(async ({ parsedInput: { text, attachmentKey }, ctx }) => {
    if (attachmentKey) {
      if (!attachmentKey.startsWith(`${ctx.user.id}/`)) {
        throw new ActionError("Invalid attachment");
      }

      // Finalization check: the portable enforcement point across S3-compatible providers.
      let head;
      try {
        head = await headFile(attachmentKey);
      } catch {
        throw new ActionError("Attachment was not uploaded");
      }

      const isValid =
        head.contentLength !== undefined &&
        head.contentLength <= MAX_ATTACHMENT_BYTES &&
        head.contentType !== undefined &&
        (attachmentContentTypes as readonly string[]).includes(head.contentType);

      if (!isValid) {
        await deleteFile(attachmentKey);
        throw new ActionError("Invalid attachment");
      }
    }

    await data.createTodo({ userId: ctx.user.id, text, attachmentKey });
    revalidatePath("/dashboard/todos");
  });

export const toggleTodo = authActionClient
  .inputSchema(toggleTodoSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    const updated = await data.toggleTodo(ctx.user.id, id);

    if (updated.length === 0) throw new ActionError("Todo not found");
    revalidatePath("/dashboard/todos");
  });

export const deleteTodo = authActionClient
  .inputSchema(deleteTodoSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    const deleted = await data.deleteTodo(ctx.user.id, id);

    if (deleted.length === 0) throw new ActionError("Todo not found");

    // Delete the object after the row is gone, or the bucket accumulates unreachable files.
    const attachmentKey = deleted[0]?.attachmentKey;
    if (attachmentKey) await deleteFile(attachmentKey);

    revalidatePath("/dashboard/todos");
  });

export const deleteCompletedTodos = authActionClient.action(async ({ ctx }) => {
  const deleted = await data.deleteCompletedTodos(ctx.user.id);

  for (const todo of deleted) {
    if (todo.attachmentKey) await deleteFile(todo.attachmentKey);
  }

  revalidatePath("/dashboard/todos");
});

export const getDownloadUrl = authActionClient
  .inputSchema(getDownloadUrlSchema)
  .action(async ({ parsedInput: { key }, ctx }) => {
    // Ownership check reads the prefix — same rule as every delete.
    if (!key.startsWith(`${ctx.user.id}/`)) throw new ActionError("Not found");
    return { url: await getPresignedDownloadUrl(key) };
  });
