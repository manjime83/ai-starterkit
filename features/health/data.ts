import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function pingDatabase() {
  await db.execute(sql`SELECT 1`);
}
