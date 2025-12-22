import type { StorybookConfig } from "@storybook/nextjs";

import { join, dirname } from "path";
import { resolve } from "path";
import { readFileSync } from "fs";

// Load environment variables from .env.local manually
// This ensures FIGMA_TOKEN is available to Storybook
// (dotenv might not be available, so we load manually)
try {
  const envPath = resolve(__dirname, "../.env.local");
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env.local might not exist, that's okay
  console.warn("Could not load .env.local file:", error);
}

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

    // Inject FIGMA_TOKEN into browser bundle for Storybook addon-designs
    // SECURITY: Only inject token in development mode, NEVER in production builds
    // Storybook sets NODE_ENV=production during 'storybook build'
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction && process.env.FIGMA_TOKEN) {
      // Only inject token in dev mode (storybook dev)
      // Dynamically require webpack (it's available in Storybook's node_modules)
      const webpack = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.FIGMA_TOKEN": JSON.stringify(process.env.FIGMA_TOKEN),
        })
      );
    } else if (isProduction) {
      // Production build: explicitly set token to undefined for security
      // This ensures token is NEVER in production Storybook builds
      const webpack = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.FIGMA_TOKEN": JSON.stringify(undefined),
        })
      );
      console.log(
        "🔒 Production build: FIGMA_TOKEN excluded for security"
      );
    } else if (!process.env.FIGMA_TOKEN) {
      console.warn(
        "⚠️  FIGMA_TOKEN not found. Figma design integration will not work in Storybook."
      );
      console.warn(
        "   Please add FIGMA_TOKEN to apps/dashboard/.env.local and restart Storybook."
      );
    }

    return config;
  },
};
export default config;
