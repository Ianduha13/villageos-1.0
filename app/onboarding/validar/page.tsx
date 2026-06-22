import Link from "next/link";
import { Stepper } from "@/components/Stepper";

/*
 * Screen 3 — Validar sua entrada (Etapa 3 de 4, mockup 01.05.55). The community
 * confirms the new villager's relation and releases access. In the Phase-1
 * walkable slice the identity submit already records the validation and lands
 * the person on Vila Agora; this screen documents the validation surface (who
 * is validating, progress, why we validate) for the real multi-actor flow.
 */
export default function ValidarPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <span className="font-semibold tracking-tight">VillageOS</span>
      </div>
      <p className="text-sm text-text-secondary">Etapa 3 de 4</p>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Validar sua entrada
      </h1>
      <p className="text-text-secondary">
        A comunidade confirma sua relação com a Barra e libera seu acesso à vila.
      </p>
      <Stepper current={3} />

      <section className="glass-card space-y-4 p-5">
        <h2 className="text-sm font-semibold">Progresso da validação</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span>Convite aceito</span>
            <span className="text-accent-green">Concluído</span>
          </li>
          <li className="flex justify-between">
            <span>Identidade criada</span>
            <span className="text-accent-green">Concluído</span>
          </li>
          <li className="flex justify-between">
            <span>1 validação recebida</span>
            <span className="text-accent-green">Concluído</span>
          </li>
          <li className="flex justify-between">
            <span>Acesso de villager liberado</span>
            <span className="text-accent-cyan">Pronto</span>
          </li>
        </ul>
      </section>

      <section className="glass-card grid grid-cols-3 gap-3 p-5 text-xs">
        <Why title="Segurança comunitária" />
        <Why title="Confiança verificável" />
        <Why title="Pertencimento territorial" />
      </section>

      <Link
        href="/inicio"
        className="flex items-center justify-center gap-2 rounded-pill bg-brand-gradient px-6 py-4 font-semibold text-bg-deep shadow-glow-cyan"
      >
        Entrar na Vila Agora ›
      </Link>
    </div>
  );
}

function Why({ title }: { title: string }) {
  return (
    <div className="space-y-1">
      <div className="font-semibold text-accent-cyan">{title}</div>
    </div>
  );
}
