import { createClaimAction } from "../claims/actions";
import { CLAIM_TYPE_LABELS, type ClaimType } from "@/lib/claims";

export const dynamic = "force-dynamic";

/*
 * Criar uma ação — the center "+" FAB destination (mockup). Captures a
 * structured claim (title + statement + type) and runs createClaimAction, which
 * persists it and appends claim.created to the Reality Ledger, then lands on the
 * claim detail.
 */
export default function CriarPage() {
  const types = Object.keys(CLAIM_TYPE_LABELS) as ClaimType[];

  return (
    <form action={createClaimAction} className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <span className="font-semibold tracking-tight">VillageOS</span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight">Criar uma ação</h1>
      <p className="text-text-secondary">
        Registre uma observação, necessidade ou proposta. A vila poderá pedir
        provas e a IA da Vila vai ajudar — mas quem decide é a comunidade.
      </p>

      <div className="glass-card space-y-4 p-5">
        <label className="block text-sm">
          O que está acontecendo?
          <input
            name="title"
            required
            placeholder="Ex.: A trilha da Costa da Lagoa está com lixo acumulado"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>

        <label className="block text-sm">
          Detalhes <span className="text-text-secondary">(opcional)</span>
          <textarea
            name="statement"
            rows={4}
            maxLength={1000}
            placeholder="Descreva o contexto, o local e por que isso importa para a vila…"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>
      </div>

      <fieldset className="glass-card space-y-3 p-5">
        <legend className="px-1 text-sm font-semibold">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {types.map((t, i) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-pill border border-hairline bg-surface-2 px-3 py-2 text-sm has-[:checked]:border-accent-green has-[:checked]:text-accent-green"
            >
              <input
                type="radio"
                name="type"
                value={t}
                defaultChecked={i === 0}
                className="accent-[var(--accent-green)]"
              />
              {CLAIM_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-brand-gradient px-6 py-4 font-semibold text-bg-deep shadow-glow-cyan"
      >
        Publicar na vila ›
      </button>
    </form>
  );
}
