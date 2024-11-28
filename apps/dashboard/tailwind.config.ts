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
      colors: {
        dark: "#131313",
        middleDark: "#1A1B1A",
        light: "#F6F6F7",
        colored: "#E66AE9",
        accentColored: "#332433",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
