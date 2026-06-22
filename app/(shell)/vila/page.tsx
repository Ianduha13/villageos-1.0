import Link from "next/link";
import { getDb } from "@/db/client";
import { ensureArena } from "@/lib/onboarding";
import {
  listClaims,
  CLAIM_TYPE_LABELS,
  CLAIM_STATUS_LABELS,
} from "@/lib/claims";

export const dynamic = "force-dynamic";

/*
 * Vila — the community feed of claims for the Barra arena, newest first. Each
 * card links to the claim detail (proofs, IA da Vila insights, decision).
 */
export default async function VilaPage() {
  const db = getDb();
  const arena = await ensureArena(db);
  const claims = await listClaims(db, arena.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Vila</h1>
        <p className="text-text-secondary">
          O que a comunidade da Barra da Lagoa está coordenando.
        </p>
      </header>

      {claims.length === 0 ? (
        <div className="glass-card p-5 text-sm text-text-secondary">
          Nenhuma ação ainda. Toque no <span className="text-accent-cyan">+</span>{" "}
          para criar a primeira.
        </div>
      ) : (
        <ul className="space-y-3">
          {claims.map((c) => (
            <li key={c.id}>
              <Link
                href={`/claims/${c.id}`}
                className="glass-card block space-y-2 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-pill border border-hairline bg-surface-2 px-2.5 py-0.5 text-xs text-accent-cyan">
                    {CLAIM_TYPE_LABELS[c.type]}
                  </span>
                  <span className="rounded-pill border border-hairline bg-surface-2 px-2.5 py-0.5 text-xs text-text-secondary">
                    {CLAIM_STATUS_LABELS[c.status]}
                  </span>
                </div>
                <p className="font-medium leading-snug">{c.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
