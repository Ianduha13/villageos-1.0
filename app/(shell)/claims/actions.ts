"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getSessionPersonId } from "@/lib/auth";
import { ensureArena } from "@/lib/onboarding";
import {
  createClaim,
  changeClaimStatus,
  type ClaimType,
  type ClaimStatus,
} from "@/lib/claims";

/*
 * Claim server actions. The actor is the current session person (nullable for
 * the demo); the arena resolves to Barra da Lagoa. Each call goes through the
 * domain service so the Reality Ledger is always written.
 */
export async function createClaimAction(formData: FormData): Promise<void> {
  const db = getDb();
  const title = String(formData.get("title") ?? "").trim();
  const statement = String(formData.get("statement") ?? "").trim();
  const type = String(formData.get("type") ?? "observation") as ClaimType;
  if (!title) throw new Error("Título obrigatório");

  const arena = await ensureArena(db);
  const authorId = await getSessionPersonId();

  const claim = await createClaim(db, {
    arenaId: arena.id,
    authorId,
    title,
    statement: statement || undefined,
    type,
  });

  redirect(`/claims/${claim.id}`);
}

export async function changeClaimStatusAction(formData: FormData): Promise<void> {
  const db = getDb();
  const claimId = String(formData.get("claimId") ?? "");
  const status = String(formData.get("status") ?? "") as ClaimStatus;
  const actorId = await getSessionPersonId();
  if (!claimId || !status) throw new Error("Parâmetros inválidos");
  await changeClaimStatus(db, { claimId, status, actorId });
}
