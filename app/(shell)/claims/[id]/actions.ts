"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSessionPersonId } from "@/lib/auth";
import { ensureArena } from "@/lib/onboarding";
import { attachProof, type ProofType } from "@/lib/proofs";
import { getArtifactStore } from "@/lib/storage";
import {
  analyzeClaim,
  reviewInsight,
  type InsightType,
  type ReviewStatus,
} from "@/lib/steward";
import { recordDecision } from "@/lib/decisions";

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

export async function analyzeClaimAction(formData: FormData): Promise<void> {
  const db = getDb();
  const claimId = String(formData.get("claimId") ?? "");
  const insightType = String(
    formData.get("insightType") ?? "claim_summary",
  ) as InsightType;
  if (!claimId) throw new Error("claimId obrigatório");
  const actorId = await getSessionPersonId();
  await analyzeClaim(db, { claimId, insightType, actorId });
  revalidatePath(`/claims/${claimId}`);
}

export async function reviewInsightAction(formData: FormData): Promise<void> {
  const db = getDb();
  const insightId = String(formData.get("insightId") ?? "");
  const claimId = String(formData.get("claimId") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  if (!insightId || !status) throw new Error("Parâmetros inválidos");
  const actorId = await getSessionPersonId();
  await reviewInsight(db, { insightId, status, actorId });
  revalidatePath(`/claims/${claimId}`);
}

export async function recordDecisionAction(formData: FormData): Promise<void> {
  const db = getDb();
  const claimId = String(formData.get("claimId") ?? "");
  const decision = String(formData.get("decision") ?? "").trim();
  const rationale = String(formData.get("rationale") ?? "").trim();
  if (!claimId || !decision) throw new Error("Decisão obrigatória");
  const arena = await ensureArena(db);
  const decidedBy = await getSessionPersonId();
  await recordDecision(db, {
    claimId,
    arenaId: arena.id,
    decision,
    rationale: rationale || undefined,
    decidedBy,
  });
  revalidatePath(`/claims/${claimId}`);
}
