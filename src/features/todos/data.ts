import { db } from "@/db";
import { todos } from "@/db/schema";
import { and, desc, eq, not } from "drizzle-orm";

export async function getTodos(userId: string) {
  return db.query.todos.findMany({
    where: eq(todos.userId, userId),
    orderBy: [desc(todos.createdAt)],
  });
}

export async function insertTodo(input: { userId: string; text: string; attachmentKey?: string | null }) {
  const [todo] = await db
    .insert(todos)
    .values({ userId: input.userId, text: input.text, attachmentKey: input.attachmentKey })
    .returning();
  return todo;
}

export async function toggleTodoCompleted(input: { id: string; userId: string }) {
  const [todo] = await db
    .update(todos)
    .set({ completed: not(todos.completed) })
    .where(and(eq(todos.id, input.id), eq(todos.userId, input.userId)))
    .returning();
  return todo;
}

export async function deleteCompletedTodos(userId: string) {
  return db
    .delete(todos)
    .where(and(eq(todos.userId, userId), eq(todos.completed, true)))
    .returning();
}
