import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { makeDb, type Database } from "@/db/client";
import { applyMigrations } from "@/db/migrate";
import { proofs, events } from "@/db/schema";
import { ensureArena } from "@/lib/onboarding";
import { createClaim, getClaim } from "@/lib/claims";
import { attachProof, listProofsForClaim } from "@/lib/proofs";

/*
 * Phase-B acceptance: attaching a proof writes the proofs row AND proof.attached,
 * and advances an open claim to under_review with claim.status_changed — all on
 * the Reality Ledger, in one transaction.
 */
describe("proofs integration", () => {
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

  it("attaches a proof, logs it, and advances the claim to under_review", async () => {
    const arena = await ensureArena(db);
    const claim = await createClaim(db, {
      arenaId: arena.id,
      title: "Mutirão de limpeza reduziu o lixo na trilha",
      type: "observation",
    });
    expect(claim.status).toBe("open");

    const proof = await attachProof(db, {
      claimId: claim.id,
      arenaId: arena.id,
      proofType: "link",
      uri: "https://example.org/fotos/mutirao",
      description: "Antes e depois",
    });

    const [row] = await db.select().from(proofs).where(eq(proofs.id, proof.id));
    expect(row.uri).toBe("https://example.org/fotos/mutirao");
    expect(row.claimId).toBe(claim.id);

    const attached = await listProofsForClaim(db, claim.id);
    expect(attached).toHaveLength(1);

    // Claim advanced to under_review.
    const fresh = await getClaim(db, claim.id);
    expect(fresh?.status).toBe("under_review");

    // Ledger trail: proof.attached + claim.status_changed.
    const ledger = await db
      .select()
      .from(events)
      .where(eq(events.arenaId, arena.id));
    const types = ledger.map((e) => e.eventType);
    expect(types).toContain("proof.attached");
    expect(types).toContain("claim.status_changed");
  });
});
