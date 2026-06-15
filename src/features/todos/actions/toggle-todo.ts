"use server";

import { authActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { toggleTodoCompleted } from "../data";
import { toggleTodoSchema } from "../schemas";

export const toggleTodo = authActionClient.inputSchema(toggleTodoSchema).action(async ({ parsedInput, ctx }) => {
  const todo = await toggleTodoCompleted({ id: parsedInput.id, userId: ctx.user.id });
  revalidatePath("/dashboard/todos");
  return todo;
});
