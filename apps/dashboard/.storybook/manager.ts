import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "dark",

    // Branding
    brandTitle: "Orbit UI",
    brandUrl: "/",
    brandImage: "./images/orbit-ui-logo.png",
    brandTarget: "_self",

    // UI colors
    colorPrimary: "#27272A", // Primary color
    colorSecondary: "#EC762E", // Secondary color (used for highlights)

    // Backgrounds
    appBg: "#18181B", // Main background
    appContentBg: "#18181B", // Content area background
    appBorderColor: "#27272A", // Border color
    appBorderRadius: 0, // Border radius

    // Toolbar (top bar)
    barTextColor: "#FAFAFA", // Toolbar text color
    barSelectedColor: "#EC762E", // Selected item color
    barBg: "#18181B", // Toolbar background

    // Text colors
    textColor: "#A1A1AA", // Primary text
    textInverseColor: "#18181B", // Inverse text
    textMutedColor: "#52525B", // Muted text

    // Typography
    fontBase: '"Roboto Mono", sans-serif',
    fontCode: '"Roboto Mono", monospace',
  }),
});
