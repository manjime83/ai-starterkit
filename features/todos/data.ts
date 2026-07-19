import { db } from "@/db";
import { todos } from "@/db/schema";
import { and, desc, eq, not } from "drizzle-orm";

export type Todo = typeof todos.$inferSelect;

export async function getTodos(userId: string) {
  return db.query.todos.findMany({
    where: eq(todos.userId, userId),
    orderBy: [desc(todos.createdAt)],
  });
}

export async function createTodo(values: { userId: string; text: string; attachmentKey?: string }) {
  await db.insert(todos).values(values);
}

// Every mutation below scopes by userId so a user can never touch another user's rows,
// and returns the affected rows so callers can detect misses and clean up attachments.
export async function toggleTodo(userId: string, id: string) {
  return db
    .update(todos)
    .set({ completed: not(todos.completed) })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
}

export async function deleteTodo(userId: string, id: string) {
  return db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
}

export async function deleteCompletedTodos(userId: string) {
  return db
    .delete(todos)
    .where(and(eq(todos.userId, userId), eq(todos.completed, true)))
    .returning();
}
