import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./templates/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xl4k: "2000px",
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
      },
      colors: {
        darkest: "rgb(from var(--background) r g b / <alpha-value>)",
        dark: "rgb(from var(--card) r g b / <alpha-value>)",
        middleDark: "rgb(from var(--border) r g b / <alpha-value>)",
        lightDark: "rgb(from var(--muted) r g b / <alpha-value>)",
        foreground: "rgb(from var(--muted-foreground) r g b / <alpha-value>)",
        white: "rgb(from var(--foreground) r g b / <alpha-value>)",
        tangerine: "rgb(from var(--brand) r g b / <alpha-value>)",
        error: "rgb(from var(--error) r g b / <alpha-value>)",
        warning: "rgb(from var(--warning) r g b / <alpha-value>)",
        success: "rgb(from var(--success) r g b / <alpha-value>)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      letterSpacing: {
        wider: "0.72px",
      },
      size: {
        "icon-xxs": "16px",
        "icon-xs": "20px",
        "icon-sm": "24px",
        "icon-md": "36px",
        "icon-lg": "48px",
        "icon-xl": "76px",
      },
      fontSize: {
        "alternative-sm": "13px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
