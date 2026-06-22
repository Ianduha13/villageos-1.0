import Link from "next/link";
import { bootstrapDemoInvite } from "./actions";

// Touches the Reality Ledger (seeds the demo invite) — render per request.
export const dynamic = "force-dynamic";

/*
 * Screen 1 — Convite recebido (mockup 01.05.43). "Você foi convidado para
 * entrar na vila digital da Barra da Lagoa." Accepting the invite carries the
 * invite token into the identity step.
 *
 * The demo invite is bootstrapped here so the slice is walkable without a seed
 * script; in production the token arrives via a deep link.
 */
export default async function ConvitePage() {
  const { token } = await bootstrapDemoInvite();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <span className="font-semibold tracking-tight">VillageOS</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">
        <span className="brand-gradient-text">🌊 Barra da Lagoa</span>
      </h1>

      <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-surface-2 px-3 py-1.5 text-sm text-accent-green">
        ● Convite recebido
      </span>

      <h2 className="text-3xl font-extrabold leading-tight">
        Você foi convidado para entrar na vila digital da{" "}
        <span className="brand-gradient-text">Barra da Lagoa.</span>
      </h2>
      <p className="text-text-secondary">
        Participe da rede local, colabore com a comunidade e ajude a construir
        mais autonomia para a vila.
      </p>

      <div className="glass-card space-y-1 p-5">
        <div className="text-sm text-text-secondary">Convidado por:</div>
        <div className="text-xl font-bold">João</div>
        <div className="text-sm text-accent-green">Villager verificado ✓</div>
        <div className="pt-2 text-sm text-text-secondary">Código do convite</div>
        <div className="font-mono text-lg tracking-widest brand-gradient-text">
          {token}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Principle title="Mapa vivo" desc="Recursos e pessoas reais" />
        <Principle title="Missões" desc="Ações que geram impacto" />
        <Principle title="Infinitos" desc="Economia local colaborativa" />
        <Principle title="IA da Vila" desc="Inteligência ao serviço da gente" />
      </div>

      <Link
        href={`/onboarding/identidade?token=${encodeURIComponent(token)}`}
        className="flex items-center justify-center gap-2 rounded-pill bg-brand-gradient px-6 py-4 font-semibold text-bg-deep shadow-glow-cyan"
      >
        Aceitar convite ›
      </Link>
    </div>
  );
}

function Principle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass-card p-4">
      <div className="font-semibold text-accent-cyan">{title}</div>
      <div className="text-text-secondary">{desc}</div>
    </div>
  );
}
