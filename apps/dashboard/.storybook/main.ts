import type { StorybookConfig } from "@storybook/nextjs";

import { dirname } from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

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

  webpackFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@apollo/client": dirname(
        require.resolve("@apollo/client/package.json"),
      ),
    };
    return config;
  },

  env: (config) => ({
    ...config,
    FIGMA_TOKEN: process.env.FIGMA_TOKEN || "",
    FIGMA_FILE_URL: process.env.FIGMA_FILE_URL || "",
  }),
};

export default config;
