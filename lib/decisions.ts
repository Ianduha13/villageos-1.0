import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { appendEvent, withEvent } from "@/db/ledger";
import { claims, decisions, type Decision } from "@/db/schema";

/*
 * Decisions domain service (thesis: Trust → Coordination). A decision is
 * recorded by a HUMAN — the IA da Vila has no path here (FR: AI never decides).
 * Recording one moves the claim to `decided` and appends decision.created +
 * claim.status_changed atomically on the Reality Ledger.
 */
export class DecisionError extends Error {}

export type RecordDecisionInput = {
  claimId: string;
  arenaId: string;
  decision: string;
  rationale?: string;
  decidedBy?: string | null;
};

export async function recordDecision(
  db: Database,
  input: RecordDecisionInput,
): Promise<Decision> {
  const text = input.decision.trim();
  if (!text) throw new DecisionError("Decisão obrigatória");

  return withEvent(
    db,
    async (tx) => {
      const [decision] = await tx
        .insert(decisions)
        .values({
          claimId: input.claimId,
          decidedBy: input.decidedBy ?? null,
          decision: text,
          rationale: input.rationale?.trim() || null,
        })
        .returning();

      await tx
        .update(claims)
        .set({ status: "decided" })
        .where(eq(claims.id, input.claimId));
      await appendEvent(tx, {
        arenaId: input.arenaId,
        eventType: "claim.status_changed",
        actorId: input.decidedBy ?? null,
        entityType: "claim",
        entityId: input.claimId,
        payload: { status: "decided", reason: "decision.created" },
      });

      return decision;
    },
    (decision) => ({
      arenaId: input.arenaId,
      eventType: "decision.created",
      actorId: input.decidedBy ?? null,
      entityType: "decision",
      entityId: decision.id,
      payload: { claimId: input.claimId },
    }),
  );
}

export async function getDecisionForClaim(
  db: Database,
  claimId: string,
): Promise<Decision | null> {
  const [d] = await db
    .select()
    .from(decisions)
    .where(eq(decisions.claimId, claimId))
    .limit(1);
  return d ?? null;
}
