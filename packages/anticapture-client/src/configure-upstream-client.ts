import { axiosInstance, setConfig } from "@kubb/plugin-client/clients/axios";

import { inboundAuthStorage } from "./request-context.ts";

export function configureUpstreamClient(): void {
  const baseURL = process.env["ANTICAPTURE_API_URL"] ?? "http://localhost:4001";
  const apiKey = process.env["ANTICAPTURE_API_KEY"];
  const forwardClientAuth = process.env["FORWARD_CLIENT_AUTH"] === "true";

  // When forwarding client auth, never install the shared upstream key:
  // requests without an inbound Authorization must reach Gateful anonymous
  // (and get a per-tenant 401) instead of riding the shared key.
  const useSharedKey = apiKey !== undefined && !forwardClientAuth;

  setConfig({
    baseURL,
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
