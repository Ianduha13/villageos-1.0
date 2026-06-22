import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { makeDb, type Database } from "@/db/client";
import { applyMigrations } from "@/db/migrate";
import { claims, events } from "@/db/schema";
import { ensureArena } from "@/lib/onboarding";
import {
  createClaim,
  changeClaimStatus,
  listClaims,
  getClaim,
} from "@/lib/claims";

/*
 * Phase-A acceptance: creating and moving a claim persists the row AND appends
 * the Reality Ledger entries every later derived view depends on. Real Postgres
 * via Testcontainers (pgvector image, matching the Terraform stack).
 */
describe("claims integration", () => {
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

  it("creates a claim and writes claim.created to the ledger", async () => {
    const arena = await ensureArena(db);

    const claim = await createClaim(db, {
      arenaId: arena.id,
      title: "Trilha da Costa com lixo acumulado",
      statement: "Observado no fim de semana.",
      type: "observation",
    });
    expect(claim.status).toBe("open");

    const [row] = await db.select().from(claims).where(eq(claims.id, claim.id));
    expect(row.title).toBe("Trilha da Costa com lixo acumulado");
    expect(row.arenaId).toBe(arena.id);

    const ledger = await db
      .select()
      .from(events)
      .where(eq(events.entityId, claim.id));
    expect(ledger.map((e) => e.eventType)).toContain("claim.created");

    const list = await listClaims(db, arena.id);
    expect(list.find((c) => c.id === claim.id)).toBeTruthy();
  });

  it("changes status and writes claim.status_changed", async () => {
    const arena = await ensureArena(db);
    const claim = await createClaim(db, {
      arenaId: arena.id,
      title: "Precisamos de uma horta comunitária",
      type: "need",
    });

    const moved = await changeClaimStatus(db, {
      claimId: claim.id,
      status: "needs_proof",
    });
    expect(moved.status).toBe("needs_proof");

    const fresh = await getClaim(db, claim.id);
    expect(fresh?.status).toBe("needs_proof");

    const ledger = await db
      .select()
      .from(events)
      .where(eq(events.entityId, claim.id));
    const types = ledger.map((e) => e.eventType);
    expect(types).toContain("claim.created");
    expect(types).toContain("claim.status_changed");
  });
});
