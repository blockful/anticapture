import type { StorybookConfig } from "@storybook/nextjs";

import { dirname } from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: resolve(__dirname, "../.env.local"),
});

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../shared/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-designs",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  staticDirs: ["../public"],

  env: (config) => ({
    ...config,
    FIGMA_TOKEN: process.env.FIGMA_TOKEN || "",
    FIGMA_FILE_URL: process.env.FIGMA_FILE_URL || "",
  }),
};

export default config;
