import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import {
  getClaim,
  CLAIM_TYPE_LABELS,
  CLAIM_STATUS_LABELS,
} from "@/lib/claims";

export const dynamic = "force-dynamic";

/*
 * Claim detail. Phase A shows the claim itself; later phases fill the Provas
 * (B), IA da Vila (C) and Decisão (D) sections rendered below.
 */
export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const claim = await getClaim(db, id);
  if (!claim) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-pill border border-hairline bg-surface-2 px-2.5 py-0.5 text-xs text-accent-cyan">
            {CLAIM_TYPE_LABELS[claim.type]}
          </span>
          <span className="rounded-pill border border-hairline bg-surface-2 px-2.5 py-0.5 text-xs text-text-secondary">
            {CLAIM_STATUS_LABELS[claim.status]}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
          {claim.title}
        </h1>
        {claim.statement ? (
          <p className="text-text-secondary">{claim.statement}</p>
        ) : null}
      </header>

      <section className="glass-card p-5">
        <h2 className="mb-2 text-lg font-semibold">Provas</h2>
        <p className="text-sm text-text-secondary">
          Anexe evidências para dar credibilidade a esta ação. (em breve)
        </p>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-2 text-lg font-semibold">IA da Vila</h2>
        <p className="text-sm text-text-secondary">
          A IA da Vila pode resumir e sugerir o que falta — sempre como conselho,
          nunca decidindo. (em breve)
        </p>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-2 text-lg font-semibold">Decisão</h2>
        <p className="text-sm text-text-secondary">
          A comunidade registra a decisão. (em breve)
        </p>
      </section>
    </div>
  );
}
