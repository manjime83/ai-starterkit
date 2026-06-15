"use server";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { createTodoSchema } from "../schemas";

export const createTodo = authActionClient.inputSchema(createTodoSchema).action(async ({ parsedInput, ctx }) => {
  const [todo] = await db
    .insert(todos)
    .values({ userId: ctx.user.id, text: parsedInput.text, attachmentKey: parsedInput.attachmentKey })
    .returning();
  return todo;
});
