import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { createMcpServer } from "./src/create-mcp-server.ts";
import { configureUpstreamClient } from "./src/configure-upstream-client.ts";
import { inboundAuthStorage } from "./src/request-context.ts";
import { env } from "./src/env.ts";
import pino from "pino";

const port = env.PORT;
const host = env.HOST;

const sessions = new Map<string, StreamableHTTPServerTransport>();
let shuttingDown = false;

configureUpstreamClient();

const log = pino({ name: "anticapture-mcp" });

// Token validation is delegated to Gateful: the inbound bearer is forwarded
// upstream (see configure-upstream-client) and guarded by Gateful's
// tokenAuthMiddleware, which has the Redis cache + fail-open fallback. Doing
// our own uncached Authful check here would re-introduce a hard dependency on
// Authful and 503 cache-warm tenants during an Authful restart.
log.info({ port, host }, "server starting");

async function getOrCreateTransport(
  requestSessionId: string | undefined,
): Promise<StreamableHTTPServerTransport | null> {
  if (requestSessionId) {
    return sessions.get(requestSessionId) ?? null;
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

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    const transport = await getOrCreateTransport(sessionId);
    if (!transport) {
      res
        .writeHead(404, { "Content-Type": "application/json" })
        .end(JSON.stringify({ error: "session_not_found" }));
      finish(404, { sessionId });
      return;
    }

    const inboundAuth = req.headers["authorization"];
    await (inboundAuth
      ? inboundAuthStorage.run(inboundAuth, () =>
          transport.handleRequest(req, res),
        )
      : transport.handleRequest(req, res));
    finish(res.statusCode, { sessionId });
  } catch (err) {
    log.error({ reqId, err: String(err) }, "request failed");
    if (!res.headersSent) res.writeHead(500).end(String(err));
    finish(res.statusCode || 500);
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
