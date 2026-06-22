import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { makeDb, type Database } from "@/db/client";
import { applyMigrations } from "@/db/migrate";
import { events } from "@/db/schema";
import { ensureArena } from "@/lib/onboarding";
import { createClaim, getClaim } from "@/lib/claims";
import { attachProof } from "@/lib/proofs";
import { analyzeClaim } from "@/lib/steward";
import { recordDecision, getDecisionForClaim } from "@/lib/decisions";
import { computeMetrics } from "@/lib/metrics";
import type { InferenceAdapter } from "@/lib/inference";

const stub: InferenceAdapter = {
  provider: "stub",
  model: "stub-model",
  chat: async () => "Resumo de teste.",
};

/*
 * Phase-D acceptance: a full slice (claim → proof → insight → decision) drives
 * the ledger-derived metrics, and a human decision moves the claim to `decided`
 * with decision.created on the ledger (the AI never writes here).
 */
describe("metrics + decisions integration", () => {
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

  it("derives coordination metrics from the full slice", async () => {
    const arena = await ensureArena(db);
    const claim = await createClaim(db, {
      arenaId: arena.id,
      title: "Reflorestar a encosta da Costa",
      type: "proposal",
    });
    await attachProof(db, {
      claimId: claim.id,
      arenaId: arena.id,
      proofType: "link",
      uri: "https://example.org/plano",
    });
    const insight = await analyzeClaim(db, {
      claimId: claim.id,
      insightType: "next_action",
      adapter: stub,
    });
    await recordDecision(db, {
      claimId: claim.id,
      arenaId: arena.id,
      decision: "Aprovado: mutirão mensal",
      rationale: "Provas e consenso da vila",
    });

    const m = await computeMetrics(db, arena.id);
    expect(m.claimCount).toBeGreaterThanOrEqual(1);
    expect(m.proofCount).toBeGreaterThanOrEqual(1);
    expect(m.insightCount).toBeGreaterThanOrEqual(1);
    expect(m.decisionCount).toBeGreaterThanOrEqual(1);
    expect(m.cci).not.toBeNull();
    expect(m.returnOnAliveness).not.toBeNull();

    // Decision moved the claim to `decided` and left a ledger trail.
    const decided = await getClaim(db, claim.id);
    expect(decided?.status).toBe("decided");
    const dec = await getDecisionForClaim(db, claim.id);
    expect(dec?.decision).toContain("Aprovado");

    const ledger = await db
      .select()
      .from(events)
      .where(eq(events.entityId, claim.id));
    expect(ledger.map((e) => e.eventType)).toContain("claim.created");

    const all = await db
      .select()
      .from(events)
      .where(eq(events.arenaId, arena.id));
    expect(all.map((e) => e.eventType)).toContain("decision.created");
    expect(insight.humanReviewStatus).toBe("pending");
  });
});
