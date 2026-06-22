import { BottomNav } from "@/components/BottomNav";
import { StatusPill } from "@/components/StatusPill";

/*
 * Glassmorphic app shell — the dark consumer surface shared by every in-app
 * screen (Início / Mapa / Vila / Perfil / Criar). The raised-FAB bottom nav and
 * the "Nó local: Barra Online" sovereignty pill anchor the bottom, matching the
 * mockups. Content scrolls above them with padding for the fixed chrome.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-bg-base">
      <main className="mx-auto max-w-md px-5 pb-44 pt-6">{children}</main>
      <BottomNav />
      <footer className="fixed inset-x-0 bottom-4 z-30">
        <StatusPill />
      </footer>
    </div>
  );
}
