// "Nó local: Barra Online" — the sovereignty status pill that footers every
// screen in the mockups. The green dot reflects the local sovereign node being
// reachable (always online in the Phase-1 slice).
export function StatusPill({ label = "Barra Online" }: { label?: string }) {
  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-pill border border-hairline bg-surface-2 px-4 py-2 text-sm backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-accent-green shadow-glow-cyan" />
      <span className="text-text-secondary">
        Nó local:{" "}
        <span className="font-medium text-accent-green">{label}</span>
      </span>
    </div>
  );
}
