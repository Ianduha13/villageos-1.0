import { StatusPill } from "@/components/StatusPill";

/*
 * Onboarding chrome — the light hero screens 1–4 of the mockups (Convite →
 * Criar identidade → Validar entrada). A subtle top wash evokes the tropical
 * Barra da Lagoa hero; the sovereignty pill anchors the bottom.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-bg-base">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{
          background:
            "radial-gradient(120% 80% at 80% 0%, rgba(54,213,224,0.25), transparent 60%)",
        }}
      />
      <main className="relative mx-auto max-w-md px-5 pb-24 pt-8">
        {children}
      </main>
      <footer className="fixed inset-x-0 bottom-4">
        <StatusPill />
      </footer>
    </div>
  );
}
