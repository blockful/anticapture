import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { daos } from "./route";
import { DaosService } from "./service";

function stubFetch(
  responses: Record<string, object>,
  fallback: { ok: boolean; status?: number } = { ok: false, status: 500 },
) {
  vi.spyOn(global, "fetch").mockImplementation(((url: string) => {
    const key = Object.keys(responses).find((k) => String(url).includes(k));
    if (key) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[key]),
      });
    }
    return Promise.resolve(fallback);
  }) as typeof fetch);
}

describe("daos route", () => {
  const daoApis = new Map([
    ["uni", "http://uni-api"],
    ["ens", "http://ens-api"],
  ]);

  let app: OpenAPIHono;

  beforeEach(() => {
    app = new OpenAPIHono();
    daos(app, new DaosService(daoApis));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should aggregate responses from all DAOs", async () => {
    stubFetch({
      "uni-api": { id: "uni", chainId: 1 },
      "ens-api": { id: "ens", chainId: 1 },
    });

    const res = await app.request("/daos");
    const body = (await res.json()) as {
      items: Record<string, unknown>[];
      totalCount: number;
    };

    expect(res.status).toBe(200);
    expect(body.totalCount).toBe(2);
    expect(body.items).toHaveLength(2);
  });

  it("should handle partial failures gracefully", async () => {
    stubFetch({
      "uni-api": { id: "uni", chainId: 1 },
    });

    const res = await app.request("/daos");
    const body = (await res.json()) as {
      items: Record<string, unknown>[];
      totalCount: number;
    };

    expect(res.status).toBe(200);
    expect(body.totalCount).toBe(1);
    expect(body.items[0].id).toBe("uni");
  });

  it("should return empty list when no DAOs are configured", async () => {
    const emptyApp = new OpenAPIHono();
    daos(emptyApp, new DaosService(new Map()));

    const res = await emptyApp.request("/daos");
    const body = (await res.json()) as {
      items: Record<string, unknown>[];
      totalCount: number;
    };

    expect(res.status).toBe(200);
    expect(body.totalCount).toBe(0);
    expect(body.items).toHaveLength(0);
  });
});
