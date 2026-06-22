import { Stepper } from "@/components/Stepper";
import { completeOnboarding } from "../actions";
import { RELATION_LABELS, type PersonRelation } from "@/lib/types";

/*
 * Screen 2 — Criar sua identidade (Etapa 2 de 4, mockup 01.05.50). Avatar,
 * @handle, sobre, relation chips, skills, offers, privacy. Submitting runs the
 * full onboarding service (identity → community validation) and lands the new
 * villager on Vila Agora — the Phase-1 end-to-end slice.
 */
export default async function IdentidadePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const relations = Object.keys(RELATION_LABELS) as PersonRelation[];

  return (
    <form action={completeOnboarding} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <span className="font-semibold tracking-tight">VillageOS</span>
      </div>

      <p className="text-sm text-text-secondary">Etapa 2 de 4</p>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Criar sua identidade
      </h1>
      <p className="text-text-secondary">
        Conte pra vila quem você é e como pode contribuir.
      </p>
      <Stepper current={2} />

      <div className="glass-card space-y-4 p-5">
        <label className="block text-sm">
          Como você quer aparecer na vila?
          <input
            name="handle"
            required
            placeholder="@breno"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>

        <label className="block text-sm">
          Nome completo
          <input
            name="fullName"
            placeholder="Breno"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>

        <label className="block text-sm">
          Sobre você
          <textarea
            name="bio"
            rows={3}
            maxLength={250}
            placeholder="Apaixonado pela Barra da Lagoa e pela natureza…"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>
      </div>

      <fieldset className="glass-card space-y-3 p-5">
        <legend className="px-1 text-sm font-semibold">
          Sua relação com a Barra
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {relations.map((r, i) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-2 rounded-pill border border-hairline bg-surface-2 px-3 py-2 text-sm has-[:checked]:border-accent-green has-[:checked]:text-accent-green"
            >
              <input
                type="radio"
                name="relation"
                value={r}
                defaultChecked={i === 0}
                className="accent-[var(--accent-green)]"
              />
              {RELATION_LABELS[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="glass-card space-y-4 p-5">
        <label className="block text-sm">
          Habilidades <span className="text-text-secondary">(separe por vírgula)</span>
          <input
            name="skills"
            placeholder="Mapeamento, Comunicação, Coordenação"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>
        <label className="block text-sm">
          O que você oferece?{" "}
          <span className="text-text-secondary">(separe por vírgula)</span>
          <input
            name="offers"
            placeholder="Conhecimento, Serviços, Produtos locais"
            className="mt-1 w-full rounded-card border border-hairline bg-surface-2 px-4 py-3 outline-none focus:border-accent-cyan"
          />
        </label>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-brand-gradient px-6 py-4 font-semibold text-bg-deep shadow-glow-cyan"
      >
        Continuar ›
      </button>
    </form>
  );
}
