import { IncomingMessage, ServerResponse } from "node:http";

export const validateAuthToken = (
  req: IncomingMessage,
  res: ServerResponse,
): boolean => {
  const apiToken = process.env.API_TOKEN;

  if (!apiToken) return true;

  const authHeader = req.headers["authorization"];
  if (authHeader === `Bearer ${apiToken}`) return true;

  res.writeHead(401, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Unauthorized" }));
  return false;
};
