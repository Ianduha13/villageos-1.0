import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { and, eq } from "drizzle-orm";
import { makeDb, type Database } from "@/db/client";
import { applyMigrations } from "@/db/migrate";
import { arenas, persons, invites, events } from "@/db/schema";
import {
  redeemInvite,
  createIdentity,
  recordValidation,
  ensureArena,
} from "@/lib/onboarding";

/*
 * Phase-1 acceptance: invite → identity → community validation produces the
 * person + arena rows AND the append-only Reality Ledger entries that every
 * later derived view depends on. Runs against a real Postgres via
 * Testcontainers (pgvector image, matching the Terraform stack).
 */
describe("onboarding integration", () => {
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

  it("walks invite → identity → validation and writes rows + ledger events", async () => {
    const arena = await ensureArena(db);

    const token = `BLG-TEST-${Date.now()}`;
    await db.insert(invites).values({
      arenaId: arena.id,
      token,
      invitedByName: "João",
    });

    // Step 1 — redeem invite.
    const { inviteId, arenaId } = await redeemInvite(db, token);
    expect(arenaId).toBe(arena.id);

    // Step 2 — create identity.
    const { personId } = await createIdentity(db, {
      inviteId,
      arenaId,
      identity: {
        handle: "breno",
        fullName: "Breno",
        relation: "morador",
        skills: ["Mapeamento", "Comunicação"],
        offers: ["Conhecimento"],
      },
    });

    const [person] = await db
      .select()
      .from(persons)
      .where(eq(persons.id, personId));
    expect(person.handle).toBe("breno");
    expect(person.status).toBe("pending_validation");
    expect(person.skills).toEqual(["Mapeamento", "Comunicação"]);

    // Invite is now marked redeemed.
    const [usedInvite] = await db
      .select()
      .from(invites)
      .where(eq(invites.id, inviteId));
    expect(usedInvite.redeemedByPersonId).toBe(personId);

    // Step 3 — community validation activates the person.
    const result = await recordValidation(db, {
      arenaId,
      personId,
      validatorId: personId,
    });
    expect(result.activated).toBe(true);

    const [activated] = await db
      .select()
      .from(persons)
      .where(eq(persons.id, personId));
    expect(activated.status).toBe("active");

    // Ledger assertions — the slice must leave a Reality Ledger trail.
    const ledger = await db
      .select()
      .from(events)
      .where(eq(events.entityId, personId));
    const types = ledger.map((e) => e.eventType);
    expect(types).toContain("identity.created");
    expect(types).toContain("validation.recorded");
    expect(types).toContain("person.activated");
  });

  it("rejects an already-redeemed invite", async () => {
    const arena = await ensureArena(db);
    const token = `BLG-USED-${Date.now()}`;
    const [inv] = await db
      .insert(invites)
      .values({ arenaId: arena.id, token })
      .returning();
    await db
      .update(invites)
      .set({ redeemedByPersonId: null, redeemedAt: new Date() })
      .where(eq(invites.id, inv.id));

    // Create a person and tie the invite to it to simulate prior redemption.
    const [p] = await db
      .insert(persons)
      .values({ arenaId: arena.id, handle: "ocupado", relation: "morador" })
      .returning();
    await db
      .update(invites)
      .set({ redeemedByPersonId: p.id })
      .where(eq(invites.id, inv.id));

    await expect(redeemInvite(db, token)).rejects.toThrow(/já utilizado/);
  });

  it("seeds exactly one Barra da Lagoa arena via ensureArena", async () => {
    const a = await ensureArena(db);
    const b = await ensureArena(db);
    expect(a.id).toBe(b.id);
    const rows = await db
      .select()
      .from(arenas)
      .where(
        and(eq(arenas.name, "Barra da Lagoa"), eq(arenas.id, a.id)),
      );
    expect(rows).toHaveLength(1);
  });
});
