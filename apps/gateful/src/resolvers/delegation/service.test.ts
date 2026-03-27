import { vi } from "vitest";

import { DelegationService } from "./service";
import type { DelegationPercentageResponse } from "./service";

function createDelegationResponse(
  items: { date: string; high: string }[],
  pageInfo?: Partial<DelegationPercentageResponse["pageInfo"]>,
): DelegationPercentageResponse {
  return {
    items,
    totalCount: items.length,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      endDate: null,
      startDate: null,
      ...pageInfo,
    },
  };
}

function stubFetch(responses: Record<string, DelegationPercentageResponse>) {
  vi.spyOn(global, "fetch").mockImplementation(((url: unknown) => {
    const urlStr = String(url);
    for (const [key, response] of Object.entries(responses)) {
      if (urlStr.includes(key)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
        });
      }
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  }) as typeof fetch);
}

describe("DelegationService", () => {
  const daoApis = new Map([
    ["ens", "http://ens-api"],
    ["uni", "http://uni-api"],
  ]);
  let service: DelegationService;

  beforeEach(() => {
    service = new DelegationService(daoApis);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should calculate mean percentage across DAOs", async () => {
    stubFetch({
      "ens-api": createDelegationResponse([
        { date: "1600041600", high: "50.00" },
        { date: "1600128000", high: "60.00" },
      ]),
      "uni-api": createDelegationResponse([
        { date: "1600041600", high: "40.00" },
        { date: "1600128000", high: "50.00" },
      ]),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "1600041600",
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({ date: "1600041600", high: "45.00" });
    expect(result.items[1]).toEqual({ date: "1600128000", high: "55.00" });
  });

  it("should return empty response when no DAOs have data", async () => {
    stubFetch({
      "ens-api": createDelegationResponse([]),
      "uni-api": createDelegationResponse([]),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "1600041600",
    });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should calculate mean with decimal precision", async () => {
    stubFetch({
      "ens-api": createDelegationResponse([
        { date: "1600041600", high: "12.35" },
      ]),
      "uni-api": createDelegationResponse([
        { date: "1600041600", high: "23.46" },
      ]),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "1600041600",
    });

    expect(result.items[0].high).toBe("17.91");
  });

  it("should apply limit", async () => {
    const items = [
      { date: "1", high: "10" },
      { date: "2", high: "20" },
      { date: "3", high: "30" },
    ];
    stubFetch({
      "ens-api": createDelegationResponse(items),
      "uni-api": createDelegationResponse(items),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "1",
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
  });

  it("should propagate hasNextPage from DAOs", async () => {
    stubFetch({
      "ens-api": createDelegationResponse([{ date: "1", high: "10" }], {
        hasNextPage: true,
      }),
      "uni-api": createDelegationResponse([{ date: "1", high: "20" }]),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "1",
    });

    expect(result.pageInfo.hasNextPage).toBe(true);
  });

  it("should set hasPreviousPage when paginating forward", async () => {
    stubFetch({
      "ens-api": createDelegationResponse([{ date: "2", high: "10" }]),
      "uni-api": createDelegationResponse([{ date: "2", high: "20" }]),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "1",
      after: "2",
    });

    expect(result.pageInfo.hasPreviousPage).toBe(true);
  });

  it("should align responses when DAOs have different start dates", async () => {
    stubFetch({
      "ens-api": createDelegationResponse([
        { date: "100", high: "10.00" },
        { date: "200", high: "20.00" },
      ]),
      "uni-api": createDelegationResponse([{ date: "200", high: "30.00" }]),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "100",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({ date: "200", high: "25.00" });
  });

  it("should set correct dates in pageInfo", async () => {
    const items = [
      { date: "100", high: "10" },
      { date: "200", high: "20" },
      { date: "300", high: "30" },
    ];
    stubFetch({
      "ens-api": createDelegationResponse(items),
      "uni-api": createDelegationResponse(items),
    });

    const result = await service.getAverageDelegationPercentage({
      startDate: "100",
    });

    expect(result.pageInfo.startDate).toBe("100");
    expect(result.pageInfo.endDate).toBe("300");
  });
});
