import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, expect, it, vi } from "vitest";

import { health } from ".";

describe("health controller", () => {
  it("returns 200 when the database ping succeeds", async () => {
    const app = new Hono();
    const execute = vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] });

    health(app, { execute });

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      database: "ok",
    });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("returns 503 when the database ping fails", async () => {
    const app = new Hono();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const execute = vi
      .fn()
      .mockRejectedValue(new Error("database unavailable"));

    health(app, { execute });

    const response = await app.request("/health");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      database: "error",
      message: "Database health check failed",
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Health check database ping failed",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
