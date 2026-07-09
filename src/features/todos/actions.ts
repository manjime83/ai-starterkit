"use server";

import { authActionClient } from "@/lib/safe-action";
import { deleteFile, getPresignedDownloadUrl, getPresignedUploadUrl } from "@/lib/storage";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteCompletedTodos, insertTodo, toggleTodoCompleted } from "./data";
import { createTodoSchema, toggleTodoSchema } from "./schemas";

export const createTodo = authActionClient.inputSchema(createTodoSchema).action(async ({ parsedInput, ctx }) => {
  const todo = await insertTodo({
    userId: ctx.user.id,
    text: parsedInput.text,
    attachmentKey: parsedInput.attachmentKey,
  });
  revalidatePath("/dashboard/todos");
  return todo;
});

export const toggleTodo = authActionClient.inputSchema(toggleTodoSchema).action(async ({ parsedInput, ctx }) => {
  const todo = await toggleTodoCompleted({ id: parsedInput.id, userId: ctx.user.id });
  revalidatePath("/dashboard/todos");
  return todo;
});

export const deleteCompletedTodosAction = authActionClient.action(async ({ ctx }) => {
  const deletedTodos = await deleteCompletedTodos(ctx.user.id);
  const attachmentKeys = deletedTodos
    .map((todo) => todo.attachmentKey)
    .filter((attachmentKey): attachmentKey is string => Boolean(attachmentKey));

  const deleteResults = await Promise.allSettled(attachmentKeys.map((attachmentKey) => deleteFile(attachmentKey)));
  const failedAttachmentDeletes = deleteResults.filter((result) => result.status === "rejected").length;

  if (failedAttachmentDeletes > 0) {
    console.error(`Failed to delete ${failedAttachmentDeletes} completed todo attachment(s)`);
  }

  revalidatePath("/dashboard/todos");
  return { count: deletedTodos.length };
});

export const getUploadUrl = authActionClient
  .inputSchema(z.object({ filename: z.string(), contentType: z.string() }))
  .action(async ({ parsedInput }) => {
    const key = `uploads/${createId()}-${parsedInput.filename}`;
    const url = await getPresignedUploadUrl(key, parsedInput.contentType || undefined);
    return { url, key };
  });

export const getDownloadUrl = authActionClient
  .inputSchema(z.object({ key: z.string() }))
  .action(async ({ parsedInput }) => {
    const url = await getPresignedDownloadUrl(parsedInput.key);
    return { url };
  });
