import Link from "next/link";
import { getCurrentPerson } from "@/lib/auth";
import { getDb } from "@/db/client";
import { ensureArena } from "@/lib/onboarding";
import { computeMetrics } from "@/lib/metrics";

// Reads the session + person from the DB — render per request.
export const dynamic = "force-dynamic";

/*
 * Vila Agora — the home shell (mockup Screen 4). Phase 1 lands the header, the
 * ∞ saldo placeholder and an empty Resumo da vila; Phase 2 populates the summary
 * counts and the community feed from the Reality Ledger, Phase 4 the real ∞
 * balance, Phase 7 the Saúde da comunidade.
 */
export default async function VilaAgoraPage() {
  const person = await getCurrentPerson();
  const handle = person?.handle ?? "villager";
  const db = getDb();
  const arena = await ensureArena(db);
  const metrics = await computeMetrics(db, arena.id);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="font-semibold tracking-tight">VillageOS</span>
        </div>
        <p className="text-sm text-text-secondary">Bem-vindo à vila</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Vila Agora</h1>
        <p className="text-text-secondary">
          Veja o que está acontecendo na Barra da Lagoa em tempo real.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface-2 px-3 py-1.5 text-sm text-accent-green">
          ● Acesso liberado
        </span>
        <div className="flex items-center gap-3 rounded-card border border-hairline bg-surface px-4 py-2 shadow-glow-purple">
          <span className="text-2xl text-accent-purple">∞</span>
          <div className="leading-tight">
            <div className="text-xs text-text-secondary">Saldo</div>
            <div className="text-lg font-bold">— </div>
          </div>
        </div>
      </div>

      <section className="glass-card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resumo da vila</h2>
          <span className="text-xs text-text-secondary">
            Olá, <span className="text-accent-cyan">@{handle}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Ações" value={metrics.claimCount} />
          <Stat label="Provas" value={metrics.proofCount} />
          <Stat label="Insights IA" value={metrics.insightCount} />
          <Stat label="Decisões" value={metrics.decisionCount} />
        </div>

        <div className="rounded-card border border-hairline bg-surface-2 p-4 text-center">
          <div className="text-xs text-text-secondary">Return on Aliveness</div>
          <div className="text-3xl font-extrabold text-accent-green">
            {metrics.returnOnAliveness ?? "—"}
            {metrics.returnOnAliveness !== null ? (
              <span className="text-base text-text-secondary">/100</span>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] text-text-secondary">
            Índice de capacidade de coordenação (CCI-v0)
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/vila"
            className="rounded-pill border border-hairline bg-surface-2 px-4 py-2 text-accent-cyan"
          >
            Ver ações ›
          </Link>
          <a
            href="/export?format=json"
            className="rounded-pill border border-hairline bg-surface-2 px-4 py-2"
          >
            Exportar JSON
          </a>
          <a
            href="/export?format=csv"
            className="rounded-pill border border-hairline bg-surface-2 px-4 py-2"
          >
            Exportar CSV
          </a>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-hairline bg-surface-2 p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}
