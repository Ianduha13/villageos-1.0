import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { makeDb, type Database } from "@/db/client";
import { applyMigrations } from "@/db/migrate";
import { aiInsights, events } from "@/db/schema";
import { ensureArena } from "@/lib/onboarding";
import { createClaim, getClaim } from "@/lib/claims";
import { analyzeClaim, reviewInsight } from "@/lib/steward";
import type { InferenceAdapter } from "@/lib/inference";

/*
 * Phase-C acceptance: the IA da Vila produces a `pending`, fully-attributed
 * advisory insight + ai_insight.created — and crucially does NOT decide (the
 * claim status is untouched by analysis). A stub adapter keeps the test offline.
 */
const stubAdapter: InferenceAdapter = {
  provider: "stub",
  model: "stub-model",
  chat: async () => "Resumo de teste da ação.",
};

describe("IA da Vila integration", () => {
  let container: StartedPostgreSqlContainer;
  let db: Database;
  let close: () => Promise<void>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("pgvector/pgvector:pg16")
      .withDatabase("villageos")
      .withUsername("village")
      .withPassword("village")
      .start();
    const url = container.getConnectionUri();
    await applyMigrations(url);
    const made = makeDb(url);
    db = made.db;
    close = () => made.sql.end();
  }, 120_000);

  afterAll(async () => {
    await close?.();
    await container?.stop();
  });

  it("creates a pending, attributed insight and does not decide", async () => {
    const arena = await ensureArena(db);
    const claim = await createClaim(db, {
      arenaId: arena.id,
      title: "Falta iluminação na praça",
      type: "need",
    });
    const statusBefore = claim.status;

    const insight = await analyzeClaim(db, {
      claimId: claim.id,
      insightType: "claim_summary",
      adapter: stubAdapter,
    });

    expect(insight.humanReviewStatus).toBe("pending");
    expect(insight.modelProvider).toBe("stub");
    expect(insight.modelName).toBe("stub-model");
    expect(insight.promptVersion).toBe("v1");
    expect(insight.content.length).toBeGreaterThan(0);

    // The AI never decides: the claim status is unchanged by analysis.
    const after = await getClaim(db, claim.id);
    expect(after?.status).toBe(statusBefore);

    const ledger = await db
      .select()
      .from(events)
      .where(eq(events.entityId, insight.id));
    expect(ledger.map((e) => e.eventType)).toContain("ai_insight.created");
  });

  it("records human review of an insight", async () => {
    const arena = await ensureArena(db);
    const claim = await createClaim(db, {
      arenaId: arena.id,
      title: "Proposta: feira de trocas mensal",
      type: "proposal",
    });
    const insight = await analyzeClaim(db, {
      claimId: claim.id,
      insightType: "next_action",
      adapter: stubAdapter,
    });

    const reviewed = await reviewInsight(db, {
      insightId: insight.id,
      status: "accepted",
    });
    expect(reviewed.humanReviewStatus).toBe("accepted");

    const [row] = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.id, insight.id));
    expect(row.humanReviewStatus).toBe("accepted");
  });
});
