import type { StorybookConfig } from "@storybook/nextjs";

import { join, dirname } from "path";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

// Load environment variables from .env. local manually
// This ensures FIGMA_TOKEN is available to Storybook
// (dotenv might not be available, so we load manually)
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  try {
    const envFile = readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1]. trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (! process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // Failed to parse .env.local, log quietly
    console.info("ℹ️  Could not parse .env.local file");
  }
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
    "../stories/**/*. stories.@(js|jsx|mjs|ts|tsx)",
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
    if (process.env. FIGMA_TOKEN) {
      // Token exists - inject it into the bundle
      const webpack = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.FIGMA_TOKEN": JSON.stringify(process.env.FIGMA_TOKEN),
        })
      );
      console.log("✅ FIGMA_TOKEN injetado no bundle do Storybook");
    } else {
      // Token not found - warn the user
      console.warn(
        "⚠️  FIGMA_TOKEN não encontrado.  Integração com Figma não funcionará no Storybook."
      );
      console.warn(
        "   Para desenvolvimento local:  adicione FIGMA_TOKEN ao arquivo apps/dashboard/.env.local"
      );
      console.warn(
        "   Para Vercel (preview/production): adicione FIGMA_TOKEN nas Environment Variables do projeto"
      );
    }

    return config;
  },
};
export default config;