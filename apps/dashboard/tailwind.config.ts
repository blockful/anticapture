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
        xl: "1200px",
      },
      colors: {
        darkest: "#09090B",
        dark: "#18181B",
        middleDark: "#3F3F46",
        lightDark: "#27272A",
        foreground: "#A1A1AA",
        white: "#FFFFFF",
        colored: "#E66AE9",
        accentColored: "#332433",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
