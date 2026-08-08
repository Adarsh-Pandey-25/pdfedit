import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "400px",
        "3xl": "1920px",
      },
      colors: {
        primary: {
          DEFAULT: "#F97316",
          light: "#FED7AA",
          dark: "#C2410C",
        },
        secondary: {
          DEFAULT: "#EF4444",
          light: "#FCA5A5",
          dark: "#B91C1C",
        },
        accent: {
          DEFAULT: "#FBBF24",
          light: "#FDE68A",
        },
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          card: "var(--bg-card)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      maxWidth: {
        container: "1280px",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(249, 115, 22, 0.12)",
        glow: "0 4px 24px -4px rgba(249, 115, 22, 0.2)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "rgba(249, 115, 22, 0.4)" },
          "50%": { borderColor: "rgba(239, 68, 68, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
