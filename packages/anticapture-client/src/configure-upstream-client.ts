import { axiosInstance, setConfig } from "@kubb/plugin-client/clients/axios";

import { inboundAuthStorage } from "./request-context.ts";

export function configureUpstreamClient(): void {
  const baseURL = process.env["ANTICAPTURE_API_URL"] ?? "http://localhost:4001";
  const apiKey = process.env["ANTICAPTURE_API_KEY"];
  const forwardClientAuth = process.env["FORWARD_CLIENT_AUTH"] === "true";

  setConfig({
    baseURL,
    headers: {
      "x-client-source": "anticapture-mcp",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
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
