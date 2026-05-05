import http from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { setConfig } from "@kubb/plugin-client/clients/axios";
import { createMcpServer } from "./src/create-mcp-server.ts";
import pino from "pino";

const baseURL = process.env["ANTICAPTURE_API_URL"] ?? "http://localhost:4001";
const apiKey = process.env["ANTICAPTURE_API_KEY"];
const API_KEY = process.env["ANTICAPTURE_MCP_API_KEY"];
const port = Number(process.env["PORT"] ?? 3100);
const host = process.env["HOST"] ?? "0.0.0.0";

const sessions = new Map<string, StreamableHTTPServerTransport>();
let shuttingDown = false;

setConfig({
  baseURL,
  headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
});

const log = pino({ name: "anticapture-mcp" });

log.info(
  { baseURL, hasApiKey: !!apiKey, hasMcpKey: !!API_KEY, port, host },
  "server starting",
);

function isValidToken(token: string): boolean {
  if (!API_KEY) return true;
  try {
    if (token.length !== API_KEY.length) return false;
    return timingSafeEqual(Buffer.from(token), Buffer.from(API_KEY));
  } catch {
    return false;
  }
}

async function getOrCreateTransport(
  requestSessionId: string | undefined,
): Promise<StreamableHTTPServerTransport> {
  if (requestSessionId) {
    const existing = sessions.get(requestSessionId);
    if (existing) return existing;
  }

  const sessionId = randomUUID();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
  });

  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);

  transport.onclose = () => {
    sessions.delete(sessionId);
    mcpServer.close().catch(() => {});
  };

  sessions.set(sessionId, transport);
  return transport;
}

const httpServer = http.createServer(async (req, res) => {
  const reqId = randomUUID().slice(0, 8);
  const start = Date.now();

  const finish = (status: number, extra?: Record<string, unknown>) => {
    log.info(
      {
        reqId,
        method: req.method,
        url: req.url,
        status,
        durationMs: Date.now() - start,
        ...extra,
      },
      "request",
    );
  };

  if (req.url === "/health") {
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ status: "ok" }));
    finish(200);
    return;
  }

  if (req.url?.startsWith("/.well-known/")) {
    res.writeHead(404).end();
    finish(404);
    return;
  }

  if (API_KEY) {
    const auth = req.headers["authorization"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!isValidToken(token)) {
      res
        .writeHead(401, {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="anticapture"',
        })
        .end(JSON.stringify({ error: "invalid_token" }));
      finish(401);
      return;
    }
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    const transport = await getOrCreateTransport(sessionId);
    await transport.handleRequest(req, res);
    finish(200, { sessionId });
  } catch (err) {
    log.error({ reqId, err: String(err) }, "request failed");
    if (!res.headersSent) res.writeHead(500).end(String(err));
    finish(500);
  }
});

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info({ signal, activeSessions: sessions.size }, "shutting down");

  httpServer.close(async () => {
    try {
      await Promise.all([...sessions.values()].map((t) => t.close()));
    } catch (err) {
      log.error({ err: String(err) });
    }
    log.info("shutdown complete");
    process.exit(0);
  });

  setTimeout(() => {
    log.error("shutdown timeout, forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

httpServer.listen(port, host, () => {
  log.info({ host, port }, "listening");
});
