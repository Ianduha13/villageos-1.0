import type { Config } from "drizzle-kit";

// SQL migrations are generated from db/schema.ts and committed under
// db/migrations. The Reality Ledger (`events`) and every derived view are
// defined there — no second source of truth.
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://village:village@localhost:5432/villageos",
  },
} satisfies Config;
