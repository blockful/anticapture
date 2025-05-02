import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xl4k: "2000px",
      },
      colors: {
        darkest: "#09090B",
        dark: "#18181B",
        middleDark: "#3F3F46",
        lightDark: "#27272A",
        foreground: "#A1A1AA",
        white: "#FAFAFA",
        colored: "#E66AE9",
        accentColored: "#332433",
        tangerine: "#EC762E",
        error: "#f87171",
        warning: "#facc15",
        success: "#4ade80",
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
      fontFamily: {
        roboto: ["var(--font-roboto)"],
      },
      size: {
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
