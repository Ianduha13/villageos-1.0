"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/*
 * 5-slot bottom navigation with a raised center FAB — Início / Mapa / + / Vila /
 * Perfil (mockup Screen 4). Routes for Mapa/Vila/Perfil land in later phases;
 * they are present now so the shell matches the mockups. The center "+" opens
 * Criar uma ação (Phase 2).
 */
const items = [
  { href: "/inicio", label: "Início", icon: HomeIcon },
  { href: "/mapa", label: "Mapa", icon: MapIcon },
  { href: "/criar", label: "", icon: PlusIcon, fab: true },
  { href: "/vila", label: "Vila", icon: VilaIcon },
  { href: "/perfil", label: "Perfil", icon: PerfilIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md px-4">
      <div className="flex items-end justify-between rounded-card border border-hairline bg-surface px-4 py-3 backdrop-blur-xl">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          if (item.fab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label="Criar uma ação"
                className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient shadow-glow-cyan"
              >
                <Icon className="h-7 w-7 text-bg-deep" />
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 text-xs",
                active ? "text-accent-cyan" : "text-text-secondary",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IconProps = { className?: string };

function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function MapIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function VilaIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M14.5 20c.2-2 1.6-3.5 4-3.5" />
    </svg>
  );
}
function PerfilIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
