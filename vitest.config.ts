import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Integration tests (onboarding, claims, proofs, economy) spin up a
// Testcontainers Postgres, so they need a generous timeout and the node
// environment. Coverage gates mirror the villageos/ reference (≥80% global;
// the metrics/economy folds reach ≥95% once those phases land).
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "lib/**/*.test.ts", "worker/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
