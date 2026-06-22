"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSessionPersonId } from "@/lib/auth";
import { ensureArena } from "@/lib/onboarding";
import { attachProof, type ProofType } from "@/lib/proofs";
import { getArtifactStore } from "@/lib/storage";

/*
 * Claim-detail server actions. attachProofAction takes either a link/text uri or
 * an uploaded file (stored via the artifact store), then runs the domain service
 * so proof.attached lands on the Reality Ledger.
 */
export async function attachProofAction(formData: FormData): Promise<void> {
  const db = getDb();
  const claimId = String(formData.get("claimId") ?? "");
  const proofType = String(formData.get("proofType") ?? "link") as ProofType;
  const description = String(formData.get("description") ?? "").trim();
  let uri = String(formData.get("uri") ?? "").trim();
  if (!claimId) throw new Error("claimId obrigatório");

  const file = formData.get("file") as File | null;
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await getArtifactStore().put(file.name || "proof", bytes);
    uri = stored.uri;
  }
  if (!uri) throw new Error("Forneça um link ou um arquivo");

  const arena = await ensureArena(db);
  const validatorId = await getSessionPersonId();
  await attachProof(db, {
    claimId,
    arenaId: arena.id,
    proofType,
    uri,
    description: description || undefined,
    validatorId,
  });

  revalidatePath(`/claims/${claimId}`);
}
