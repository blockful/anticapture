import { OpenAPIHono } from "@hono/zod-openapi";
import { vi } from "vitest";

import { CircuitBreakerRegistry } from "../../shared/circuit-breaker-registry";

import { averageDelegation } from "./route";
import { DelegationService } from "./service";
import type { DelegationPercentageResponse } from "./service";

describe("average-delegation route", () => {
  let app: OpenAPIHono;

  beforeEach(() => {
    const daoApis = new Map([["uni", "http://uni-api"]]);

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [{ date: "1000", high: "50.00" }],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endDate: "1000",
            startDate: "1000",
          },
        }),
    } as Response);

    app = new OpenAPIHono();
    averageDelegation(
      app,
      new DelegationService(daoApis, new CircuitBreakerRegistry()),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should default to a 90-day window when startDate is missing", async () => {
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const res = await app.request(
      "/aggregations/average-delegation-percentage",
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = String(fetchSpy.mock.calls[0][0]);
    const startDateParam = new URL(calledUrl).searchParams.get("startDate");
    expect(startDateParam).not.toBeNull();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ninetyDaysAgo = nowSeconds - 90 * 86_400;
    const startDateNum = Number(startDateParam);
    expect(startDateNum).toBeGreaterThanOrEqual(ninetyDaysAgo - 5);
    expect(startDateNum).toBeLessThanOrEqual(ninetyDaysAgo + 5);
  });

  it("should return 400 when startDate >= endDate", async () => {
    const res = await app.request(
      "/aggregations/average-delegation-percentage?startDate=2000&endDate=1000",
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(JSON.stringify(body)).toContain("startDate must be before endDate");
  });

  it("should return data for valid request", async () => {
    const res = await app.request(
      "/aggregations/average-delegation-percentage?startDate=1000",
    );
    const body = (await res.json()) as DelegationPercentageResponse;

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].high).toBe("50.00");
  });

  it("should accept optional parameters", async () => {
    const res = await app.request(
      "/aggregations/average-delegation-percentage?startDate=1000&endDate=2000&limit=10&orderDirection=asc",
    );

    expect(res.status).toBe(200);
  });
});
