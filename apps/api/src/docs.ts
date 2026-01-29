import { OpenAPIHono as Hono } from "@hono/zod-openapi";

export function docs(app: Hono) {
  app.doc("/docs", {
    openapi: "3.0.2",
    info: {
      title: "Swagger Anticapture Server",
      description:
        "Anticapture is an application with the purpose of analyze and warn the main governance risks of each DAO",
      version: "1.0.0",
    },
    externalDocs: {
      description: "Anticapture Monorepo",
      url: "https://github.com/blockful-io/anticapture",
    },
  });
}
