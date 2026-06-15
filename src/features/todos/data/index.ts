import { db } from "@/db";
import { todos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getTodos(userId: string) {
  return db.query.todos.findMany({
    where: eq(todos.userId, userId),
    orderBy: [desc(todos.createdAt)],
  });
}
