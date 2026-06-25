"use server";

import { authActionClient } from "@/lib/safe-action";
import { deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { deleteCompletedTodos } from "../data";

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
