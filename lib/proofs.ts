import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { appendEvent, withEvent } from "@/db/ledger";
import { claims, proofs, type Proof } from "@/db/schema";

/*
 * Proofs domain service (thesis: Claim → Proof). Attaching evidence appends
 * proof.attached and, when the claim is still open/needs_proof, advances it to
 * under_review — emitting claim.status_changed in the SAME transaction so the
 * Reality Ledger never drifts from the rows.
 */

export type ProofType = Proof["proofType"];

export const PROOF_TYPE_LABELS: Record<ProofType, string> = {
  image: "Imagem",
  document: "Documento",
  link: "Link",
  observation: "Observação",
  measurement: "Medição",
  testimony: "Testemunho",
  other: "Outro",
};

export class ProofError extends Error {}

export type AttachProofInput = {
  claimId: string;
  arenaId: string;
  proofType: ProofType;
  uri: string;
  description?: string;
  validatorId?: string | null;
};

export async function attachProof(
  db: Database,
  input: AttachProofInput,
): Promise<Proof> {
  if (!input.uri.trim()) throw new ProofError("Prova precisa de um link ou arquivo");

  return withEvent(
    db,
    async (tx) => {
      const [proof] = await tx
        .insert(proofs)
        .values({
          claimId: input.claimId,
          proofType: input.proofType,
          uri: input.uri.trim(),
          description: input.description?.trim() || null,
          validatorId: input.validatorId ?? null,
        })
        .returning();

      const [claim] = await tx
        .select()
        .from(claims)
        .where(eq(claims.id, input.claimId))
        .limit(1);
      if (claim && (claim.status === "open" || claim.status === "needs_proof")) {
        await tx
          .update(claims)
          .set({ status: "under_review" })
          .where(eq(claims.id, input.claimId));
        await appendEvent(tx, {
          arenaId: input.arenaId,
          eventType: "claim.status_changed",
          actorId: input.validatorId ?? null,
          entityType: "claim",
          entityId: input.claimId,
          payload: { status: "under_review", reason: "proof.attached" },
        });
      }

      return proof;
    },
    (proof) => ({
      arenaId: input.arenaId,
      eventType: "proof.attached",
      actorId: input.validatorId ?? null,
      entityType: "proof",
      entityId: proof.id,
      payload: { claimId: input.claimId, proofType: proof.proofType },
    }),
  );
}

export async function listProofsForClaim(
  db: Database,
  claimId: string,
): Promise<Proof[]> {
  return db
    .select()
    .from(proofs)
    .where(eq(proofs.claimId, claimId))
    .orderBy(desc(proofs.createdAt));
}
