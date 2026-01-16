/**
 * Figma API Client Utility
 *
 * Client-side utility to fetch Figma file data through our secure proxy.
 * Never exposes the Figma token to the browser.
 */

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  version: string;
  document: unknown;
}

export interface FigmaProxyOptions {
  fileId?: string;
  url?: string;
}

/**
 * Fetches Figma file data through the secure proxy endpoint
 *
 * @param options - Either fileId or Figma URL
 * @returns Promise resolving to Figma file data
 * @throws Error if the request fails
 */
export async function fetchFigmaFile(
  options: FigmaProxyOptions,
): Promise<FigmaFileResponse> {
  const { fileId, url } = options;

  if (!fileId && !url) {
    throw new Error("Either fileId or url must be provided");
  }

  // Determine the API base URL
  // In development, this will be localhost
  // In production, this will be your deployed domain
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const apiUrl = new URL("/api/figma", baseUrl);
  if (fileId) {
    apiUrl.searchParams.set("fileId", fileId);
  } else if (url) {
    apiUrl.searchParams.set("url", url);
  }

  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to fetch Figma file",
    }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Extracts file ID from a Figma URL
 *
 * @param figmaUrl - Full Figma design URL
 * @returns File ID or null if invalid
 */
export function extractFileIdFromUrl(figmaUrl: string): string | null {
  const match = figmaUrl.match(/figma\.com\/design\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Gets Figma access token for Storybook addon-designs
 *
 * Note: This function returns a proxy URL instead of the actual token.
 * The Storybook addon may need to be configured to use a custom fetch function.
 *
 * @param figmaUrl - Full Figma design URL
 * @returns Proxy URL that can be used to fetch Figma data
 */
export function getFigmaProxyUrl(figmaUrl: string): string {
  const fileId = extractFileIdFromUrl(figmaUrl);
  if (!fileId) {
    throw new Error("Invalid Figma URL");
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return `${baseUrl}/api/figma?fileId=${fileId}`;
}
