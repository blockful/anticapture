import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "../logger.js";
import { CircuitOpenError } from "../shared/circuit-breaker.js";
import { getErrorStatus, requestLogger } from "./logger.js";

vi.mock("../logger.js", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("requestLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["HTTP exceptions", new HTTPException(404), 404],
    ["open circuits", new CircuitOpenError("test"), 503],
    ["unknown errors", new Error("boom"), 500],
  ])("derives the final status for %s", (_label, error, status) => {
    expect(getErrorStatus(error)).toBe(status);
  });

  it("logs successful responses at info level", async () => {
    const app = new Hono();
    app.use("*", requestLogger());
    app.get("/test", (c) => c.json({ ok: true }, 201));

    const response = await app.request("/test");

    expect(response.status).toBe(201);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/test",
        status: 201,
        durationMs: expect.any(Number),
      }),
      "GET /test 201",
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
