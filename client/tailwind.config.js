/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm gold accent (EatPick reference design) — CSS-variable-backed
        // so a single `.dark` class toggle (see index.css) re-themes the
        // whole app without touching every component.
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          light: "var(--color-ink-light)",
        },
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        bg: "var(--color-bg)",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#E1483B",
        muted: "var(--color-muted)",
        // Override a few default Tailwind gray shades that are used
        // directly (border-slate-200, bg-slate-100, ...) so those also
        // respond to the dark-mode toggle instead of staying hardcoded.
        slate: {
          50: "var(--color-subtle)",
          100: "var(--color-subtle)",
          200: "var(--color-border)",
          300: "var(--color-border-strong)",
          900: "var(--color-ink)",
        },
      },
      fontFamily: {
        sans: ["Prompt", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "22px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(31,26,20,0.06), 0 1px 2px rgba(31,26,20,0.05)",
        hover: "0 12px 28px rgba(31,26,20,0.12)",
      },
      screens: {
        tablet: "768px",
        desktop: "1200px",
      },
    },
  },
  plugins: [],
};
