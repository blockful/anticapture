import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { server } from "./generated/mcp/server.ts";

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // stateless
});

await server.connect(transport);

const API_KEY = process.env["ANTICAPTURE_MCP_API_KEY"];

const httpServer = http.createServer((req, res) => {
  if (req.url?.startsWith("/.well-known/")) {
    res.writeHead(404).end();
    return;
  }

  if (API_KEY) {
    const auth = req.headers["authorization"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== API_KEY) {
      res
        .writeHead(401, { "WWW-Authenticate": 'Bearer realm="anticapture"' })
        .end();
      return;
    }
  }

  transport.handleRequest(req, res).catch((err) => {
    console.error("handleRequest error:", err);
    if (!res.headersSent) res.writeHead(500).end(String(err));
  });
});

const port = Number(process.env["PORT"] ?? 3100);
const host = process.env["HOST"] ?? "127.0.0.1";

httpServer.listen(port, host, () => {
  console.error(`Anticapture MCP server listening on http://${host}:${port}`);
});
