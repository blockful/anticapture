import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import { DefiLlamaProvider } from "./defillama-provider";

const BASE_URL = "http://defillama.test.com";
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DefiLlamaProvider", () => {
  let provider: DefiLlamaProvider;

  beforeEach(() => {
    provider = new DefiLlamaProvider(axios.create({ baseURL: BASE_URL }));
  });

  it("should fetch and transform single chain data", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 5000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should skip chain keys containing '-'", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 5000 }],
            },
            "Ethereum-OwnTokens": {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 1000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    // Only Ethereum counted, Ethereum-OwnTokens skipped
    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should handle OwnTokens (excluded from liquidTreasury)", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 5000 }],
            },
            OwnTokens: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 2000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    // OwnTokens adds to total only, not to withoutOwnToken
    // liquidTreasury = withoutOwnToken = 5000
    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should aggregate multiple chains", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 3000 }],
            },
            Polygon: {
              tvl: [{ date: 1700006400, totalLiquidityUSD: 2000 }],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 5000 }]);
  });

  it("should apply cutoff via filterWithFallback", async () => {
    server.use(
      http.get(BASE_URL, () =>
        HttpResponse.json({
          chainTvls: {
            Ethereum: {
              tvl: [
                { date: 1600000000, totalLiquidityUSD: 1000 },
                { date: 1700006400, totalLiquidityUSD: 2000 },
              ],
            },
          },
        }),
      ),
    );

    const result = await provider.fetchTreasury(1700000000);

    expect(result).toEqual([{ date: 1700006400, liquidTreasury: 2000 }]);
  });

  it("should cache after first fetch", async () => {
    let callCount = 0;
    server.use(
      http.get(BASE_URL, () => {
        callCount++;
        return HttpResponse.json({ chainTvls: {} });
      }),
    );

    await provider.fetchTreasury(0);
    await provider.fetchTreasury(0);

    expect(callCount).toBe(1);
  });

  it("should return empty array on error", async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()));

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([]);
  });
});
