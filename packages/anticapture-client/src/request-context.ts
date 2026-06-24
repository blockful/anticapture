import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Carries the inbound `Authorization` header of the MCP HTTP request being
 * handled, so the upstream axios client can forward the caller's identity
 * per-request instead of the shared upstream key.
 *
 * Written by the HTTP entrypoint (mcp-server-http.ts) around each
 * `transport.handleRequest` call; read by the request interceptor installed
 * in configure-upstream-client.ts.
 */
export const inboundAuthStorage = new AsyncLocalStorage<string>();
