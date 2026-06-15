"use server";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { authActionClient } from "@/lib/safe-action";
import { and, eq, not } from "drizzle-orm";
import { toggleTodoSchema } from "../schemas";

export const toggleTodo = authActionClient.schema(toggleTodoSchema).action(async ({ parsedInput, ctx }) => {
  const [todo] = await db
    .update(todos)
    .set({ completed: not(todos.completed) })
    .where(and(eq(todos.id, parsedInput.id), eq(todos.userId, ctx.user.id)))
    .returning();
  return todo;
});
