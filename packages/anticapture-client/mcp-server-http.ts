import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { setConfig } from "@kubb/plugin-client/clients/axios";
import { server } from "./generated/mcp/server.ts";

const baseURL = process.env["ANTICAPTURE_API_URL"] ?? "http://localhost:4001";
const apiKey = process.env["ANTICAPTURE_API_KEY"];

setConfig({
  baseURL,
  headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
});

const API_KEY = process.env["ANTICAPTURE_MCP_API_KEY"];
const port = Number(process.env["PORT"] ?? 3100);
const host = process.env["HOST"] ?? "0.0.0.0";
const publicUrl = process.env["PUBLIC_URL"] ?? `http://localhost:${port}`;

console.error("Config:", {
  baseURL,
  hasApiKey: !!apiKey,
  hasMcpKey: !!API_KEY,
  port,
  host,
  publicUrl,
});

let activeTransport: StreamableHTTPServerTransport | null = null;
let activeSessionId: string | null = null;
let connectPromise: Promise<StreamableHTTPServerTransport> | null = null;

async function getOrCreateTransport(
  requestSessionId: string | undefined,
): Promise<StreamableHTTPServerTransport> {
  if (
    requestSessionId &&
    activeSessionId === requestSessionId &&
    activeTransport
  ) {
    return activeTransport;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    if (activeTransport) {
      await activeTransport.close();
      await server.close();
      activeTransport = null;
      activeSessionId = null;
    }

    const sessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    await server.connect(transport);
    console.error(`New session created: ${sessionId}`);

    transport.onclose = () => {
      if (activeSessionId === sessionId) {
        console.error(`Session closed: ${sessionId}`);
        activeTransport = null;
        activeSessionId = null;
      }
    };

    activeTransport = transport;
    activeSessionId = sessionId;
    return transport;
  })().finally(() => {
    connectPromise = null;
  });

  return connectPromise;
}

const httpServer = http.createServer(async (req, res) => {
  const reqId = randomUUID().slice(0, 8);
  console.error(
    `[${reqId}] ${req.method} ${req.url} session=${req.headers["mcp-session-id"] ?? "-"} auth=${req.headers["authorization"] ? "present" : "absent"}`,
  );

  if (req.url === "/.well-known/oauth-protected-resource") {
    const body = JSON.stringify({
      resource: publicUrl,
      bearer_methods_supported: ["header"],
    });
    console.error(
      `[${reqId}] → 200 oauth-protected-resource resource=${publicUrl}`,
    );
    res.writeHead(200, { "Content-Type": "application/json" }).end(body);
    return;
  }

  if (req.url?.startsWith("/.well-known/")) {
    console.error(`[${reqId}] → 404 well-known not found`);
    res.writeHead(404).end();
    return;
  }

  if (API_KEY) {
    const auth = req.headers["authorization"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== API_KEY) {
      console.error(`[${reqId}] → 401 invalid token`);
      res
        .writeHead(401, {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="anticapture"',
        })
        .end(JSON.stringify({ error: "invalid_token" }));
      return;
    }
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    const transport = await getOrCreateTransport(sessionId);
    console.error(`[${reqId}] → dispatching to session ${activeSessionId}`);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error(`[${reqId}] → handleRequest error:`, err);
    if (!res.headersSent) res.writeHead(500).end(String(err));
  }
});

httpServer.listen(port, host, () => {
  console.error(`Anticapture MCP server listening on http://${host}:${port}`);
});
