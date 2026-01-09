import type { StorybookConfig } from "@storybook/nextjs";

import { join, dirname } from "path";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({
  path: resolve(__dirname, "../.env.local"),
});

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../shared/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-designs"),
  ],
  framework: getAbsolutePath("@storybook/nextjs"),
  staticDirs: ["../public"],

  webpackFinal: async (config) => {
    // Fix for Next.js 15 compatibility with Storybook
    // Disable persistent caching to avoid webpack hook issues
    config.cache = false;

    // Disable infrastructureLogging errors
    if (config.infrastructureLogging) {
      config.infrastructureLogging.level = "error";
    }

    // Fix circular dependency issues in production builds
    config.optimization = {
      ...config.optimization,
      moduleIds: "named",
      chunkIds: "named",
      mangleExports: false,
      minimize: false,
    };

    // Inject Figma env variables into browser bundle for Storybook addon-designs
    const webpack = require("webpack");
    config.plugins = config.plugins || [];

    const figmaEnvVars: Record<string, string> = {};

    if (process.env.FIGMA_TOKEN) {
      figmaEnvVars["process.env.FIGMA_TOKEN"] = JSON.stringify(
        process.env.FIGMA_TOKEN
      );
    } else {
      console.warn("⚠️ FIGMA_TOKEN not found");
    }

    if (process.env.FIGMA_FILE_URL) {
      figmaEnvVars["process.env.FIGMA_FILE_URL"] = JSON.stringify(
        process.env.FIGMA_FILE_URL
      );
    } else {
      console.warn("⚠️ FIGMA_FILE_URL not found");
    }

    if (Object.keys(figmaEnvVars).length > 0) {
      config.plugins.push(new webpack.DefinePlugin(figmaEnvVars));
    }

    return config;
  },
};
export default config;
