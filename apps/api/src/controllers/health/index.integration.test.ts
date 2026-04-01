import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";

import { health } from ".";

describe("health controller", () => {
  let client: PGlite;
  let db: Drizzle;
  let app: Hono;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });

    app = new Hono();
    health(app, db);
  });

  afterAll(async () => {
    await client.close();
  });

  it("returns 200 when the database ping succeeds", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      database: "ok",
    });
  });

  it("returns 503 when the database ping fails", async () => {
    const failingClient = new PGlite();
    const failingDb = drizzle(failingClient, { schema });
    const failingApp = new Hono();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    health(failingApp, failingDb);
    await failingClient.close();

    const response = await failingApp.request("/health");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      database: "error",
      message: "Database health check failed",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Health check database ping failed",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
