"use server";

import { authActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { insertTodo } from "../data";
import { createTodoSchema } from "../schemas";

export const createTodo = authActionClient.inputSchema(createTodoSchema).action(async ({ parsedInput, ctx }) => {
  const todo = await insertTodo({ userId: ctx.user.id, text: parsedInput.text, attachmentKey: parsedInput.attachmentKey });
  revalidatePath("/dashboard/todos");
  return todo;
});
