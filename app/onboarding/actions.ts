"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { setSession } from "@/lib/auth";
import {
  redeemInvite,
  createIdentity,
  recordValidation,
  ensureArena,
  type IdentityInput,
} from "@/lib/onboarding";
import type { PersonRelation } from "@/lib/types";

/*
 * Onboarding server actions wire the three mockup screens to the domain
 * service. For the Phase-1 demo slice the whole flow (invite → identity →
 * community validation → land on Vila Agora) is driven from a single submit so
 * a person can walk the slice end-to-end; the steps remain independent
 * functions in lib/onboarding for the real multi-actor flow.
 */
export async function completeOnboarding(formData: FormData): Promise<void> {
  const db = getDb();

  const token = String(formData.get("token") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();
  const relation = String(
    formData.get("relation") ?? "morador",
  ) as PersonRelation;

  if (!token) throw new Error("Convite obrigatório");
  if (!handle) throw new Error("Handle obrigatório");

  const { inviteId, arenaId } = await redeemInvite(db, token);

  const identity: IdentityInput = {
    handle,
    fullName: String(formData.get("fullName") ?? "") || undefined,
    bio: String(formData.get("bio") ?? "") || undefined,
    relation,
    skills: parseList(formData.get("skills")),
    offers: parseList(formData.get("offers")),
    privacy: "villagers",
  };

  const { personId } = await createIdentity(db, {
    inviteId,
    arenaId,
    identity,
  });

  // Community validation — in the demo a seeded validator confirms entry so the
  // person reaches `active` and lands on Vila Agora. In production this is other
  // villagers acting over time (mockup Screen 3).
  const validatorId = String(formData.get("validatorId") ?? personId);
  await recordValidation(db, { arenaId, personId, validatorId });

  await setSession(personId);
  redirect("/inicio");
}

/** Ensure a demo arena + invite exist so the onboarding slice is walkable. */
export async function bootstrapDemoInvite(): Promise<{ token: string }> {
  const db = getDb();
  const arena = await ensureArena(db);
  const { invites } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const token = "BLG-2026-0148";
  const [existing] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);
  if (!existing) {
    await db.insert(invites).values({
      arenaId: arena.id,
      token,
      invitedByName: "João",
    });
  }
  return { token };
}

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
