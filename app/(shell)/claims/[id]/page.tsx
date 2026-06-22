import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import {
  getClaim,
  CLAIM_TYPE_LABELS,
  CLAIM_STATUS_LABELS,
} from "@/lib/claims";
import { listProofsForClaim, PROOF_TYPE_LABELS, type ProofType } from "@/lib/proofs";
import { attachProofAction } from "./actions";

export const dynamic = "force-dynamic";

/*
 * Claim detail. Phase A: the claim. Phase B: Provas (list + attach). IA da Vila
 * (C) and Decisão (D) sections fill in later.
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

  const proofs = await listProofsForClaim(db, claim.id);
  const proofTypes = Object.keys(PROOF_TYPE_LABELS) as ProofType[];

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
        <h2 className="mb-3 text-lg font-semibold">
          Provas{" "}
          <span className="text-sm font-normal text-text-secondary">
            ({proofs.length})
          </span>
        </h2>

        {proofs.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {proofs.map((p) => (
              <li
                key={p.id}
                className="rounded-card border border-hairline bg-surface-2 p-3 text-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-pill border border-hairline px-2 py-0.5 text-xs text-accent-green">
                    {PROOF_TYPE_LABELS[p.proofType]}
                  </span>
                  <a
                    href={p.uri}
                    className="truncate text-accent-cyan underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p.uri}
                  </a>
                </div>
                {p.description ? (
                  <p className="text-text-secondary">{p.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-text-secondary">
            Nenhuma prova ainda. Anexe um link, documento ou foto.
          </p>
        )}

        <form action={attachProofAction} className="space-y-3">
          <input type="hidden" name="claimId" value={claim.id} />
          <div className="grid grid-cols-2 gap-2">
            <select
              name="proofType"
              className="rounded-card border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent-cyan"
              defaultValue="link"
            >
              {proofTypes.map((t) => (
                <option key={t} value={t}>
                  {PROOF_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              name="uri"
              placeholder="https://… (ou anexe arquivo)"
              className="rounded-card border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent-cyan"
            />
          </div>
          <input
            type="file"
            name="file"
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-pill file:border file:border-hairline file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm"
          />
          <input
            name="description"
            placeholder="Descrição (opcional)"
            className="w-full rounded-card border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent-cyan"
          />
          <button
            type="submit"
            className="w-full rounded-pill bg-brand-gradient px-5 py-3 text-sm font-semibold text-bg-deep shadow-glow-cyan"
          >
            Anexar prova
          </button>
        </form>
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
