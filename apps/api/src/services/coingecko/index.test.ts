import { http, HttpResponse, JsonBodyType } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { DaoIdEnum } from "@/lib/enums";
import { CoingeckoService } from "./index";

const API_URL = "https://api.coingecko.com/api/v3";
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
  const service = new CoingeckoService(API_URL, "test-api-key", DaoIdEnum.UNI);

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
        price: "5.42",
        timestamp: Math.floor(msTimestamp1 / 1000),
      });
      expect(result[1]).toEqual({
        price: "5.78",
        timestamp: Math.floor(msTimestamp2 / 1000),
      });
    });

    it("converts CoinGecko ms timestamps to seconds", async () => {
      const msTimestamp = 1700000000000;

      server.use(
        handleMarketChart("uniswap", {
          prices: [[msTimestamp, 10.0]],
        }),
      );

      const result = await service.getHistoricalTokenData(1);

      expect(result[0]!.timestamp).toBe(1700000000);
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
