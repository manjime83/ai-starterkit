import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function makeDb() {
  return drizzle(postgres(env.DATABASE_URL), { schema });
}

type DB = ReturnType<typeof makeDb>;

const globalForDb = globalThis as unknown as { db: DB };

export const db = globalForDb.db ?? makeDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
