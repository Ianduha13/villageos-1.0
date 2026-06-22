import type { Config } from "tailwindcss";

// Tokens are harvested from the 12 Barra da Lagoa mockups (dark navy +
// green→cyan→blue brand gradient, neon glassmorphism). The CSS custom
// properties themselves live in app/styles/tokens.css; this file exposes them
// to Tailwind so utilities like `bg-surface` / `text-accent-cyan` work.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "var(--bg-base)",
        "bg-deep": "var(--bg-deep)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        hairline: "var(--hairline)",
        brand: {
          green: "var(--brand-green)",
          teal: "var(--brand-teal)",
          blue: "var(--brand-blue)",
        },
        accent: {
          cyan: "var(--accent-cyan)",
          green: "var(--accent-green)",
          purple: "var(--accent-purple)",
          amber: "var(--accent-amber)",
          red: "var(--accent-red)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(90deg, var(--brand-green), var(--brand-teal), var(--brand-blue))",
        "wallet-gradient":
          "linear-gradient(135deg, var(--brand-blue), var(--accent-purple))",
      },
      boxShadow: {
        "glow-cyan": "0 0 24px var(--glow-cyan)",
        "glow-purple": "0 0 24px var(--glow-purple)",
      },
      borderRadius: {
        card: "1.25rem",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
