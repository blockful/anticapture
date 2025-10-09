import type { StorybookConfig } from "@storybook/nextjs";

import { join, dirname } from "path";

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

    return config;
  },
};
export default config;
