import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { aiInsights, claims, decisions, proofs } from "@/db/schema";

/*
 * Coordination metrics — ALL derived from the entity rows + Reality Ledger, no
 * second source of truth. The composite CCI-style index (0..1) is the headline
 * "Return on Aliveness". Missing submetrics are null and excluded from the
 * average (FR: null-safe), so the index is meaningful from the very first claim.
 */

export type Submetrics = {
  /** claims with ≥1 proof / claims */
  proofCoverage: number | null;
  /** decided claims / claims */
  decisionCoverage: number | null;
  /** claims with ≥1 AI insight / claims */
  aiSupportCoverage: number | null;
  /** human-reviewed insights / insights (human-in-the-loop) */
  reviewRate: number | null;
};

export type Metrics = {
  claimCount: number;
  proofCount: number;
  insightCount: number;
  decisionCount: number;
  pendingInsights: number;
  submetrics: Submetrics;
  cci: number | null;
  returnOnAliveness: number | null;
};

/** Pure: average the non-null submetrics into a 0..1 index (null if none). */
export function computeCci(s: Submetrics): number | null {
  const present = Object.values(s).filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

export async function computeMetrics(
  db: Database,
  arenaId: string,
): Promise<Metrics> {
  const arenaClaims = await db
    .select()
    .from(claims)
    .where(eq(claims.arenaId, arenaId));
  const claimIds = arenaClaims.map((c) => c.id);
  const claimCount = arenaClaims.length;

  const allProofs = claimIds.length
    ? await db.select().from(proofs).where(inArray(proofs.claimId, claimIds))
    : [];
  const allInsights = claimIds.length
    ? await db.select().from(aiInsights).where(inArray(aiInsights.claimId, claimIds))
    : [];
  const allDecisions = claimIds.length
    ? await db.select().from(decisions).where(inArray(decisions.claimId, claimIds))
    : [];

  const claimsWithProof = new Set(allProofs.map((p) => p.claimId)).size;
  const claimsWithInsight = new Set(allInsights.map((i) => i.claimId)).size;
  const decidedClaims = new Set(allDecisions.map((d) => d.claimId)).size;
  const reviewedInsights = allInsights.filter(
    (i) => i.humanReviewStatus !== "pending",
  ).length;

  const submetrics: Submetrics = {
    proofCoverage: claimCount ? claimsWithProof / claimCount : null,
    decisionCoverage: claimCount ? decidedClaims / claimCount : null,
    aiSupportCoverage: claimCount ? claimsWithInsight / claimCount : null,
    reviewRate: allInsights.length ? reviewedInsights / allInsights.length : null,
  };

  const cci = computeCci(submetrics);

  return {
    claimCount,
    proofCount: allProofs.length,
    insightCount: allInsights.length,
    decisionCount: allDecisions.length,
    pendingInsights: allInsights.length - reviewedInsights,
    submetrics,
    cci,
    returnOnAliveness: cci === null ? null : Math.round(cci * 100),
  };
}
