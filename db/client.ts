import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/*
 * Single Postgres connection pool + Drizzle client. The DATABASE_URL is wired
 * by Terraform (backend_env) inside the stack, or .env.local outside it.
 *
 * Tests construct their own client against a Testcontainers Postgres via
 * `makeDb(url)`, so this module stays import-safe even when DATABASE_URL is
 * absent at build time.
 */
export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function makeDb(connectionString: string): {
  db: Database;
  sql: ReturnType<typeof postgres>;
} {
  const sql = postgres(connectionString, { max: 10 });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

let cached: Database | undefined;

export function getDb(): Database {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  cached = makeDb(url).db;
  return cached;
}

export { schema };
