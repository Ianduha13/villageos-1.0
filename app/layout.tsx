import type { Metadata, Viewport } from "next";
import "./styles/tokens.css";

export const metadata: Metadata = {
  title: "VillageOS — Barra da Lagoa",
  description:
    "Sistema operacional da vila: coordenação, provas, economia Infinitos e IA da Vila.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a1420",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
