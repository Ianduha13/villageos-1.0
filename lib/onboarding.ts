import { eq, and } from "drizzle-orm";
import type { Database } from "@/db/client";
import { withEvent } from "@/db/ledger";
import { arenas, persons, invites } from "@/db/schema";
import type { PersonRelation } from "@/lib/types";

/*
 * Onboarding domain service — the thinnest end-to-end consumer slice:
 *   receive an invite → create an identity → pass community validation →
 *   land on Vila Agora.
 *
 * Every step appends to the Reality Ledger via withEvent(). Community
 * validation activates a person once it reaches a small threshold of
 * confirmations from existing villagers (mockup Screen 3: "1 validação
 * recebida" → "2ª validação em andamento" → "Acesso de villager será
 * liberado"). For the Phase-1 slice the threshold is 1.
 */

export const VALIDATION_THRESHOLD = 1;

export type IdentityInput = {
  handle: string;
  fullName?: string;
  bio?: string;
  avatarUri?: string;
  relation: PersonRelation;
  skills?: string[];
  offers?: string[];
  privacy?: "public" | "villagers" | "private";
};

export class OnboardingError extends Error {}

/** Step 1 — redeem a village invite token, creating the invited person shell. */
export async function redeemInvite(
  db: Database,
  token: string,
): Promise<{ inviteId: string; arenaId: string }> {
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite) throw new OnboardingError("Convite inválido");
  if (invite.redeemedByPersonId)
    throw new OnboardingError("Convite já utilizado");

  return { inviteId: invite.id, arenaId: invite.arenaId };
}

/** Step 2 — create the villager identity (Etapa 2/4) and tie it to the invite. */
export async function createIdentity(
  db: Database,
  args: { inviteId: string; arenaId: string; identity: IdentityInput },
): Promise<{ personId: string }> {
  const { inviteId, arenaId, identity } = args;

  return withEvent(
    db,
    async (tx) => {
      const [person] = await tx
        .insert(persons)
        .values({
          arenaId,
          handle: identity.handle,
          fullName: identity.fullName,
          bio: identity.bio,
          avatarUri: identity.avatarUri,
          relation: identity.relation,
          skills: identity.skills ?? [],
          offers: identity.offers ?? [],
          privacy: identity.privacy ?? "villagers",
          status: "pending_validation",
        })
        .returning();

      await tx
        .update(invites)
        .set({ redeemedByPersonId: person.id, redeemedAt: new Date() })
        .where(eq(invites.id, inviteId));

      return { personId: person.id };
    },
    (result) => ({
      arenaId,
      eventType: "identity.created",
      actorId: result.personId,
      entityType: "person",
      entityId: result.personId,
      payload: { handle: identity.handle, relation: identity.relation },
    }),
  );
}

/**
 * Step 3 — an existing villager records a community validation for a pending
 * person. Once VALIDATION_THRESHOLD confirmations land the person is activated.
 * Returns whether this validation activated the person.
 */
export async function recordValidation(
  db: Database,
  args: { arenaId: string; personId: string; validatorId: string },
): Promise<{ activated: boolean; confirmations: number }> {
  const { arenaId, personId, validatorId } = args;

  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, personId), eq(persons.arenaId, arenaId)))
    .limit(1);
  if (!person) throw new OnboardingError("Pessoa não encontrada");

  // Count prior validation events for this person from the ledger (source of
  // truth) — kept simple for Phase 1.
  const priorConfirmations = await countValidations(db, personId);
  const confirmations = priorConfirmations + 1;
  const willActivate =
    person.status !== "active" && confirmations >= VALIDATION_THRESHOLD;

  await withEvent(
    db,
    async (tx) => {
      if (willActivate) {
        await tx
          .update(persons)
          .set({ status: "active" })
          .where(eq(persons.id, personId));
      }
      return null;
    },
    {
      arenaId,
      eventType: "validation.recorded",
      actorId: validatorId,
      entityType: "person",
      entityId: personId,
      payload: { confirmations, activated: willActivate },
    },
  );

  if (willActivate) {
    await withEvent(db, async () => null, {
      arenaId,
      eventType: "person.activated",
      actorId: personId,
      entityType: "person",
      entityId: personId,
      payload: { confirmations },
    });
  }

  return { activated: willActivate, confirmations };
}

import { events } from "@/db/schema";

async function countValidations(
  db: Database,
  personId: string,
): Promise<number> {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.eventType, "validation.recorded"),
        eq(events.entityId, personId),
      ),
    );
  return rows.length;
}

/** Seed/find the Barra da Lagoa arena — used by onboarding bootstrap + tests. */
export async function ensureArena(
  db: Database,
  name = "Barra da Lagoa",
): Promise<{ id: string }> {
  const [existing] = await db
    .select()
    .from(arenas)
    .where(eq(arenas.name, name))
    .limit(1);
  if (existing) return { id: existing.id };

  const [created] = await db
    .insert(arenas)
    .values({ name, type: "village", originCell: "barra-da-lagoa.local" })
    .returning();
  return { id: created.id };
}
