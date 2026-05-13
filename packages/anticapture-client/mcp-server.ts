import { startServer } from "./generated/mcp/server.ts";
import { configureUpstreamClient } from "./src/configure-upstream-client.ts";

configureUpstreamClient();

startServer();
