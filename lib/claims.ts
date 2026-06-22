import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { withEvent } from "@/db/ledger";
import { claims, type Claim } from "@/db/schema";

/*
 * Claims domain service. A claim is a structured statement about reality
 * (thesis: Observation → Claim). Every mutation rides withEvent() so the
 * Reality Ledger stays the single source of truth.
 */

export type ClaimType = Claim["type"];
export type ClaimStatus = Claim["status"];

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  observation: "Observação",
  need: "Necessidade",
  proposal: "Proposta",
  risk: "Risco",
  decision_request: "Pedido de decisão",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  open: "Aberto",
  needs_proof: "Precisa de prova",
  under_review: "Em análise",
  verified: "Verificado",
  decided: "Decidido",
  archived: "Arquivado",
};

export class ClaimError extends Error {}

export type CreateClaimInput = {
  arenaId: string;
  authorId?: string | null;
  title: string;
  statement?: string;
  type?: ClaimType;
};

/** Create a claim and append `claim.created` to the Reality Ledger. */
export async function createClaim(
  db: Database,
  input: CreateClaimInput,
): Promise<Claim> {
  const title = input.title.trim();
  if (!title) throw new ClaimError("Título obrigatório");

  return withEvent(
    db,
    async (tx) => {
      const [claim] = await tx
        .insert(claims)
        .values({
          arenaId: input.arenaId,
          authorId: input.authorId ?? null,
          title,
          statement: input.statement?.trim() || null,
          type: input.type ?? "observation",
          status: "open",
        })
        .returning();
      return claim;
    },
    (claim) => ({
      arenaId: claim.arenaId,
      eventType: "claim.created",
      actorId: claim.authorId,
      entityType: "claim",
      entityId: claim.id,
      payload: { title: claim.title, type: claim.type },
    }),
  );
}

export async function listClaims(
  db: Database,
  arenaId: string,
): Promise<Claim[]> {
  return db
    .select()
    .from(claims)
    .where(eq(claims.arenaId, arenaId))
    .orderBy(desc(claims.createdAt));
}

export async function getClaim(
  db: Database,
  id: string,
): Promise<Claim | null> {
  const [claim] = await db
    .select()
    .from(claims)
    .where(eq(claims.id, id))
    .limit(1);
  return claim ?? null;
}

/** Move a claim to a new lifecycle status, appending `claim.status_changed`. */
export async function changeClaimStatus(
  db: Database,
  args: { claimId: string; status: ClaimStatus; actorId?: string | null },
): Promise<Claim> {
  return withEvent(
    db,
    async (tx) => {
      const [updated] = await tx
        .update(claims)
        .set({ status: args.status })
        .where(eq(claims.id, args.claimId))
        .returning();
      if (!updated) throw new ClaimError("Claim não encontrado");
      return updated;
    },
    (updated) => ({
      arenaId: updated.arenaId,
      eventType: "claim.status_changed",
      actorId: args.actorId ?? null,
      entityType: "claim",
      entityId: updated.id,
      payload: { status: updated.status },
    }),
  );
}
