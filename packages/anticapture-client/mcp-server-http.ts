import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { createMcpServer } from "./src/create-mcp-server.ts";
import { configureUpstreamClient } from "./src/configure-upstream-client.ts";
import { inboundAuthStorage } from "./src/request-context.ts";
import { AuthfulClient, hashBearerToken } from "./src/authful-client.ts";
import pino from "pino";

const tokenServiceUrl = process.env["TOKEN_SERVICE_URL"];
const internalApiKey = process.env["INTERNAL_API_KEY"];
const port = Number(process.env["PORT"] ?? 3100);
const host = process.env["HOST"] ?? "0.0.0.0";

const sessions = new Map<string, StreamableHTTPServerTransport>();
let shuttingDown = false;

configureUpstreamClient();

const log = pino({ name: "anticapture-mcp" });

// Single source of identity: every inbound request is authenticated against
// Authful (the same per-tenant token store Gateful uses), not a shared key.
const authful =
  tokenServiceUrl && internalApiKey
    ? new AuthfulClient(tokenServiceUrl, internalApiKey)
    : undefined;

log.info({ authEnabled: !!authful, port, host }, "server starting");
if (!authful) {
  log.warn(
    "TOKEN_SERVICE_URL/INTERNAL_API_KEY unset — Authful validation disabled, all requests allowed (dev only)",
  );
}

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

  if (authful) {
    const auth = req.headers["authorization"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";

    const reject401 = () => {
      res
        .writeHead(401, {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="anticapture"',
        })
        .end(JSON.stringify({ error: "invalid_token" }));
      finish(401);
    };

    if (!token) {
      reject401();
      return;
    }

    let verdict;
    try {
      verdict = await authful.validate(hashBearerToken(token));
    } catch (err) {
      // Fail closed, but distinguish a token problem (401) from Authful being
      // unreachable (503) so callers don't treat an outage as bad credentials.
      log.error({ reqId, err: String(err) }, "authful validation failed");
      res
        .writeHead(503, { "Content-Type": "application/json" })
        .end(JSON.stringify({ error: "auth_unavailable" }));
      finish(503);
      return;
    }

    if (!verdict.valid) {
      reject401();
      return;
    }
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
