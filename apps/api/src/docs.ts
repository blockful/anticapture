import { OpenAPIHono as Hono } from "@hono/zod-openapi";

export function docs(app: Hono) {
  app.doc("/docs", {
    openapi: "3.0.2",
    info: {
      title: "Anticapture API",
      description:
        "REST API for DAO governance analytics, monitoring, and risk exploration across Anticapture-supported protocols.",
      version: "1.0.0",
    },
    externalDocs: {
      description: "Anticapture Monorepo",
      url: "https://github.com/blockful-io/anticapture",
    },
  });
}
