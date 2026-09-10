import { http, HttpResponse, JsonBodyType } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { DaoIdEnum } from "@/lib/enums";
import { CoingeckoService } from "./index";

const API_URL = "https://api.coingecko.com";
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function handleMarketChart(tokenId: string, body: JsonBodyType) {
  return http.get(`${API_URL}/coins/${tokenId}/market_chart`, () =>
    HttpResponse.json(body),
  );
}

describe("CoingeckoService", () => {
  // Fresh instance per test: the service keeps the last successful response
  // to serve stale on failure, which would leak between tests otherwise.
  let service: CoingeckoService;
  beforeEach(() => {
    service = new CoingeckoService(API_URL, "test-api-key", DaoIdEnum.UNI);
  });

  describe("getHistoricalTokenData", () => {
    it("returns mapped price data from API response", async () => {
      const msTimestamp1 = 1700000000000;
      const msTimestamp2 = 1700086400000;

      server.use(
        handleMarketChart("uniswap", {
          prices: [
            [msTimestamp1, 5.42],
            [msTimestamp2, 5.78],
          ],
        }),
      );

      const result = await service.getHistoricalTokenData(7);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        price: "5.4200",
        timestamp: Math.floor(msTimestamp1 / 1000),
      });
      expect(result[1]).toEqual({
        price: "5.7800",
        timestamp: Math.floor(msTimestamp2 / 1000),
      });
    });

    it("throws HTTPException(503) when zod schema validation fails", async () => {
      server.use(handleMarketChart("uniswap", { invalid: "structure" }));

      await expect(service.getHistoricalTokenData(7)).rejects.toMatchObject({
        status: 503,
      });
    });

    it("throws HTTPException(503) when prices field has wrong type", async () => {
      server.use(handleMarketChart("uniswap", { prices: "not-an-array" }));

      await expect(service.getHistoricalTokenData(7)).rejects.toMatchObject({
        status: 503,
      });
    });

    it("throws HTTPException(503) when CoinGecko returns a non-2xx status", async () => {
      server.use(
        http.get(
          `${API_URL}/coins/uniswap/market_chart`,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      await expect(service.getHistoricalTokenData(7)).rejects.toMatchObject({
        status: 503,
      });
    });

    it("serves the last successful response when CoinGecko fails afterwards", async () => {
      let hits = 0;
      server.use(
        http.get(`${API_URL}/coins/uniswap/market_chart`, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({ prices: [[1700000000000, 5.42]] })
            : new HttpResponse(null, { status: 500 });
        }),
      );

      const first = await service.getHistoricalTokenData(7);
      const second = await service.getHistoricalTokenData(7);

      expect(hits).toBe(2);
      expect(second).toEqual(first);
      expect(second).toEqual([{ price: "5.4200", timestamp: 1700000000 }]);
    });

    it("returns empty array when API returns no prices", async () => {
      server.use(handleMarketChart("uniswap", { prices: [] }));

      const result = await service.getHistoricalTokenData(7);

      expect(result).toEqual([]);
    });

    it("uses default days=365 when not provided", async () => {
      let capturedUrl: URL | undefined;

      server.use(
        http.get(`${API_URL}/coins/uniswap/market_chart`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ prices: [] });
        }),
      );

      await service.getHistoricalTokenData();

      expect(capturedUrl?.searchParams.get("days")).toBe("365");
    });
  });

  describe("getHistoricalPricesMap", () => {
    it("returns a Map with midnight-normalized timestamps", async () => {
      const SECONDS_IN_DAY = 24 * 60 * 60;
      const msTimestamp = 1700000000000;
      const secTimestamp = Math.floor(msTimestamp / 1000);
      const expectedNormalized =
        Math.floor(secTimestamp / SECONDS_IN_DAY) * SECONDS_IN_DAY;

      server.use(
        handleMarketChart("uniswap", {
          prices: [[msTimestamp, 5.42]],
        }),
      );

      const result = await service.getHistoricalPricesMap(7);

      expect(result).toBeInstanceOf(Map);
      expect(result.get(expectedNormalized)).toBe(5.42);
    });

    it("returns an empty Map when no prices are returned", async () => {
      server.use(handleMarketChart("uniswap", { prices: [] }));

      const result = await service.getHistoricalPricesMap(7);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});
