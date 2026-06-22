import { cn } from "@/lib/utils";

// 4-node onboarding stepper (mockups: "Etapa 2 de 4"). `current` is 1-indexed.
export function Stepper({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Etapa ${current} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                done && "bg-brand-gradient text-bg-deep",
                active && "border-2 border-accent-green text-accent-green",
                !done && !active && "border border-hairline text-text-secondary",
              )}
            >
              {done ? "✓" : ""}
            </span>
            {step < total && (
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  step < current ? "bg-brand-gradient" : "bg-hairline",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
