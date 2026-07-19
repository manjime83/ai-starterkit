import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const createDb = () => drizzle(postgres(env.DATABASE_URL), { schema, casing: "snake_case" });

// Singleton to prevent connection pool exhaustion during dev hot reloads.
const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
