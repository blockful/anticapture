import type { RequestConfig } from "@anticapture/client";

/**
 * Request config for calling the SDK from the server (metadata, redirects).
 * The SDK's default base URL is the dashboard's own `/api/gateful` proxy, a
 * relative URL that only resolves in the browser; on the server the call has
 * to go to the gateway directly, with the same credentials the proxy adds.
 * Null when the gateway is not configured.
 */
export const getServerGatefulConfig = ({
  timeoutMs,
}: {
  timeoutMs: number;
}): Partial<RequestConfig> | null => {
  const baseURL = process.env.ANTICAPTURE_API_URL;
  if (!baseURL) return null;

  const token = process.env.BLOCKFUL_API_TOKEN;

  return {
    baseURL,
    headers: {
      "x-client-source": "anticapture-dashboard",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  };
};
