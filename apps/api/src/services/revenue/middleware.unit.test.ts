import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DaoIdEnum } from "@/lib/enums";

vi.mock("@/env", () => ({
  env: { DAO_ID: "UNI" },
}));

import { env } from "@/env";
import { ensOnly } from "@/services/revenue/middleware";

describe("ensOnly middleware", () => {
  let nextHandler: ReturnType<typeof vi.fn>;
  let app: Hono;

  beforeEach(() => {
    nextHandler = vi.fn((c) => c.json({ ok: true }, 200));
    app = new Hono();
    app.use("/protected", ensOnly);
    app.get("/protected", nextHandler);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invokes the next handler when DAO_ID is ENS", async () => {
    env.DAO_ID = DaoIdEnum.ENS;

    const res = await app.request("/protected");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(nextHandler).toHaveBeenCalledTimes(1);
  });

  it("returns 404 without invoking next when DAO_ID is not ENS", async () => {
    env.DAO_ID = DaoIdEnum.UNI;

    const res = await app.request("/protected");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not Found" });
    expect(nextHandler).not.toHaveBeenCalled();
  });
});
