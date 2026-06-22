import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { withEvent } from "@/db/ledger";
import {
  aiInsights,
  claims,
  proofs,
  type AiInsight,
  type Claim,
} from "@/db/schema";
import { createInferenceAdapter, type InferenceAdapter } from "@/lib/inference";

/*
 * IA da Vila — the advisory steward (thesis §7: AI proposes, human validates).
 *
 * analyzeClaim() reads a claim + its proofs, asks the inference adapter for one
 * advisory insight, and records it as `pending` with full provenance
 * (model_provider / model_name / prompt_version). It writes ONLY ai_insights +
 * events — never a decision and never a final claim status. The AI never decides.
 */

export type InsightType = AiInsight["insightType"];
export type ReviewStatus = AiInsight["humanReviewStatus"];

export const INSIGHT_TYPE_LABELS: Record<InsightType, string> = {
  claim_summary: "Resumo",
  missing_proofs: "Provas faltantes",
  next_action: "Próxima ação",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  rejected: "Rejeitado",
  edited: "Editado",
};

export const PROMPT_VERSION = "v1";

function buildPrompt(
  type: InsightType,
  claim: Claim,
  proofCount: number,
): string {
  const base = `Ação na vila: "${claim.title}". Detalhes: ${
    claim.statement ?? "(sem detalhes)"
  }. Provas anexadas: ${proofCount}.`;
  switch (type) {
    case "claim_summary":
      return `${base}\nResuma em 1-2 frases, em português, de forma neutra.`;
    case "missing_proofs":
      return `${base}\nListe as provas que ainda faltam para validar esta ação. Conciso, em português.`;
    case "next_action":
      return `${base}\nSugira a próxima ação concreta para a comunidade, em uma frase, em português. Você aconselha; a comunidade decide.`;
  }
}

export async function analyzeClaim(
  db: Database,
  args: {
    claimId: string;
    insightType: InsightType;
    actorId?: string | null;
    adapter?: InferenceAdapter;
  },
): Promise<AiInsight> {
  const adapter = args.adapter ?? createInferenceAdapter();

  const [claim] = await db
    .select()
    .from(claims)
    .where(eq(claims.id, args.claimId))
    .limit(1);
  if (!claim) throw new Error("Claim não encontrado");

  const claimProofs = await db
    .select()
    .from(proofs)
    .where(eq(proofs.claimId, claim.id));

  const prompt = buildPrompt(args.insightType, claim, claimProofs.length);
  const content = await adapter.chat(prompt);

  return withEvent(
    db,
    async (tx) => {
      const [insight] = await tx
        .insert(aiInsights)
        .values({
          claimId: claim.id,
          insightType: args.insightType,
          content: content || "(sem resposta)",
          modelProvider: adapter.provider,
          modelName: adapter.model,
          promptVersion: PROMPT_VERSION,
          humanReviewStatus: "pending",
        })
        .returning();
      return insight;
    },
    (insight) => ({
      arenaId: claim.arenaId,
      eventType: "ai_insight.created",
      actorId: args.actorId ?? null,
      entityType: "ai_insight",
      entityId: insight.id,
      payload: {
        claimId: claim.id,
        insightType: insight.insightType,
        provider: adapter.provider,
        model: adapter.model,
      },
    }),
  );
}

export async function listInsightsForClaim(
  db: Database,
  claimId: string,
): Promise<AiInsight[]> {
  return db.select().from(aiInsights).where(eq(aiInsights.claimId, claimId));
}

/** Human review of an advisory insight — accept / reject / edit. */
export async function reviewInsight(
  db: Database,
  args: { insightId: string; status: ReviewStatus; actorId?: string | null },
): Promise<AiInsight> {
  return withEvent(
    db,
    async (tx) => {
      const [updated] = await tx
        .update(aiInsights)
        .set({ humanReviewStatus: args.status })
        .where(eq(aiInsights.id, args.insightId))
        .returning();
      if (!updated) throw new Error("Insight não encontrado");
      return updated;
    },
    (updated) => ({
      arenaId: null,
      eventType: "ai_insight.reviewed",
      actorId: args.actorId ?? null,
      entityType: "ai_insight",
      entityId: updated.id,
      payload: { status: updated.humanReviewStatus },
    }),
  );
}
