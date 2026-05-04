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
const host = process.env["HOST"] ?? "127.0.0.1";

let activeTransport: StreamableHTTPServerTransport | null = null;
let activeSessionId: string | null = null;

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

  // Close existing session if any
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

  transport.onclose = () => {
    if (activeSessionId === sessionId) {
      activeTransport = null;
      activeSessionId = null;
    }
  };

  activeTransport = transport;
  activeSessionId = sessionId;
  return transport;
}

const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/.well-known/oauth-protected-resource") {
    res.writeHead(200, { "Content-Type": "application/json" }).end(
      JSON.stringify({
        resource: `http://${host}:${port}`,
        bearer_methods_supported: ["header"],
      }),
    );
    return;
  }

  if (req.url?.startsWith("/.well-known/")) {
    res.writeHead(404).end();
    return;
  }

  if (API_KEY) {
    const auth = req.headers["authorization"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== API_KEY) {
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
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("handleRequest error:", err);
    if (!res.headersSent) res.writeHead(500).end(String(err));
  }
});

httpServer.listen(port, host, () => {
  console.error(`Anticapture MCP server listening on http://${host}:${port}`);
});
