import { getCurrentPerson } from "@/lib/auth";

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

      <section className="glass-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Resumo da vila</h2>
        <p className="text-sm text-text-secondary">
          Olá, <span className="text-accent-cyan">@{handle}</span>. A vila ainda
          está em silêncio — as ações da comunidade aparecerão aqui assim que
          começarem a acontecer.
        </p>
      </section>
    </div>
  );
}
