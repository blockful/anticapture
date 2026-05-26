import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { createMcpServer } from "./src/create-mcp-server.ts";
import { configureUpstreamClient } from "./src/configure-upstream-client.ts";

configureUpstreamClient();

const server = createMcpServer();
const transport = new StdioServerTransport();

server.connect(transport).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
