import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

/*
 * Applies the SQL migrations in db/migrations in lexical order. The migration
 * files are written idempotently (IF NOT EXISTS / duplicate-object guards), so
 * applying twice is safe — which keeps the Testcontainers integration setup and
 * `npm run db:migrate` identical.
 */

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

export async function applyMigrations(connectionString: string): Promise<void> {
  const sql = postgres(connectionString, { max: 1 });
  try {
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const ddl = readFileSync(join(migrationsDir, file), "utf8");
      await sql.unsafe(ddl);
    }
  } finally {
    await sql.end();
  }
}

// Allow `tsx db/migrate.ts` from the CLI.
const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  applyMigrations(url)
    .then(() => {
      console.log("migrations applied");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
