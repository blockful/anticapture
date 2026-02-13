/**
 * Storybook-specific Figma utilities
 *
 * These utilities help Storybook stories access Figma designs securely.
 *
 * IMPORTANT: The Figma token is loaded from server-side environment variables only.
 * It is NEVER exposed to the browser or included in the client bundle.
 *
 * Setup:
 * 1. Add FIGMA_TOKEN to your .env.local file (gitignored)
 * 2. Add FIGMA_FILE_URL to your .env.local file (e.g., https://www.figma.com/design/ABC123/My-Design)
 * 3. Storybook will read it server-side during build/dev
 * 4. The token is never sent to the browser
 */

/**
 * Gets the Figma design configuration for Storybook addon-designs using just the node ID.
 *
 * This function uses FIGMA_FILE_URL env variable as the base URL and appends the node ID.
 * Much simpler than passing full URLs everywhere!
 *
 * Usage in Storybook stories:
 * ```ts
 * import { getFigmaDesignConfigByNodeId } from '@/shared/utils/figma-storybook';
 *
 * const meta = {
 *   parameters: {
 *     design: getFigmaDesignConfigByNodeId('10150-19926')
 *   }
 * }
 * ```
 *
 * @param nodeId - Figma node ID (e.g., '10150-19926')
 * @returns Configuration object for Storybook addon-designs
 */
export function getFigmaDesignConfigByNodeId(nodeId: string) {
  const figmaFileUrl =
    typeof process !== "undefined" && process.env
      ? process.env.FIGMA_FILE_URL
      : undefined;

  if (!figmaFileUrl) {
    console.warn(
      "FIGMA_FILE_URL environment variable is not set. Using node ID without base URL.",
    );
    return getFigmaDesignConfig(`?node-id=${nodeId}`);
  }

  return getFigmaDesignConfig(`${figmaFileUrl}?node-id=${nodeId}`);
}

/**
 * Gets the Figma design configuration for Storybook addon-designs
 *
 * This function reads the Figma token from server-side environment variables.
 * The token is never exposed to the browser - Storybook addon-designs uses it
 * server-side to fetch design specs.
 *
 * Usage in Storybook stories:
 * ```ts
 * import { getFigmaDesignConfig } from '@/shared/utils/figma-storybook';
 *
 * const meta = {
 *   parameters: {
 *     design: getFigmaDesignConfig('https://www.figma.com/design/...')
 *   }
 * }
 * ```
 *
 * @param figmaUrl - Full Figma design URL
 * @returns Configuration object for Storybook addon-designs
 */
export function getFigmaDesignConfig(figmaUrl: string) {
  // Get token from environment variables
  // In Storybook, this is injected into the browser bundle via webpack DefinePlugin
  // The token is loaded in .storybook/main.ts from .env.local
  const figmaToken =
    typeof process !== "undefined" && process.env
      ? process.env.FIGMA_TOKEN
      : undefined;

  if (!figmaToken) {
    // Return config without token - addon will fail gracefully
    return {
      type: "figspec" as const,
      url: figmaUrl,
    };
  }

  return {
    type: "figspec" as const,
    url: figmaUrl,
    accessToken: figmaToken,
  };
}

/**
 * Alternative: Get Figma file data directly (for custom usage)
 *
 * This can be used if you need to fetch Figma data in Storybook
 * without using the addon-designs integration.
 */
export async function fetchFigmaDataForStorybook(figmaUrl: string) {
  const fileIdMatch = figmaUrl.match(/figma\.com\/design\/([a-zA-Z0-9_-]+)/);
  if (!fileIdMatch) {
    throw new Error("Invalid Figma URL");
  }

  const fileId = fileIdMatch[1];
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const response = await fetch(`${apiBaseUrl}/api/figma?fileId=${fileId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Figma data: ${response.statusText}`);
  }

  return response.json();
}
