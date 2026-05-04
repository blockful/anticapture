import { setConfig } from "@kubb/plugin-client/clients/axios";
import { startServer } from "./generated/mcp/server.ts";

const baseURL = process.env["ANTICAPTURE_API_URL"] ?? "http://localhost:4001";
const apiKey = process.env["ANTICAPTURE_API_KEY"];

setConfig({
  baseURL,
  headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
});

startServer();
