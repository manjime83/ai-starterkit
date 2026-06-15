import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  return drizzle(postgres(env.DATABASE_URL), { schema });
}

type DB = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db: DB };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
