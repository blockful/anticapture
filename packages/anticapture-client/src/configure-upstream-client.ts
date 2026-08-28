import { axiosInstance, setConfig } from "@kubb/plugin-client/clients/axios";

import { inboundAuthStorage } from "./request-context.ts";
import { env } from "./env.ts";

export function configureUpstreamClient(): void {
  const baseURL = env.ANTICAPTURE_API_URL;
  const apiKey = env.ANTICAPTURE_API_KEY;
  const forwardClientAuth = env.FORWARD_CLIENT_AUTH;

  // When forwarding client auth, never install the shared upstream key:
  // requests without an inbound Authorization must reach Gateful anonymous
  // (and get a per-tenant 401) instead of riding the shared key.
  const useSharedKey = apiKey !== undefined && !forwardClientAuth;

  setConfig({
    baseURL,
    // Repeat array params (`type=VOTE&type=PROPOSAL`) instead of axios's
    // default bracket form (`type[]=VOTE`), which the API does not parse —
    // bracketed arrays were silently dropped, ignoring filters like
    // `voterAddressIn` and `type`.
    paramsSerializer: { indexes: null },
    headers: {
      "x-client-source": "anticapture-mcp",
      ...(useSharedKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  });

  if (forwardClientAuth) {
    axiosInstance.interceptors.request.use((config) => {
      const inboundAuth = inboundAuthStorage.getStore();
      if (inboundAuth) config.headers.set("Authorization", inboundAuth);
      return config;
    });
  }
}
