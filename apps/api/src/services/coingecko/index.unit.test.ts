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
import { captureDegradedUpstream } from "@/lib/degraded-upstream.test-support";
import { DaoIdEnum } from "@/lib/enums";
import { UpstreamUnavailableError } from "@/lib/upstream-error";
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

      const { data: result } = await service.getHistoricalTokenData(7);

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

    // A 404 means the token id is wrong, which is our misconfiguration. It has
    // to stay loud rather than degrade to an empty chart forever.
    it("throws HTTPException(502) when CoinGecko rejects the request", async () => {
      server.use(
        http.get(
          `${API_URL}/coins/uniswap/market_chart`,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      await expect(service.getHistoricalTokenData(7)).rejects.toMatchObject({
        status: 502,
      });
    });

    it("throws HTTPException(503) when CoinGecko is rate limited", async () => {
      server.use(
        http.get(
          `${API_URL}/coins/uniswap/market_chart`,
          () => new HttpResponse(null, { status: 429 }),
        ),
      );

      await expect(service.getHistoricalTokenData(7)).rejects.toBeInstanceOf(
        UpstreamUnavailableError,
      );
    });

    it("tags provider failures as an upstream failure so callers can degrade", async () => {
      server.use(
        http.get(
          `${API_URL}/coins/uniswap/market_chart`,
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      await expect(service.getHistoricalTokenData(7)).rejects.toBeInstanceOf(
        UpstreamUnavailableError,
      );
      await expect(service.getHistoricalTokenData(7)).rejects.toMatchObject({
        upstream: "coingecko",
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
      const degraded = captureDegradedUpstream();

      const first = await service.getHistoricalTokenData(7);
      const second = await service.getHistoricalTokenData(7);

      expect(hits).toBe(2);
      expect(second.data).toEqual(first.data);
      expect(second.degraded).toBe(true);
      expect(second.data).toEqual([{ price: "5.4200", timestamp: 1700000000 }]);
      // Serving stale prices is a 200, so operators only learn about it here.
      expect(degraded.recorded()).toEqual([
        {
          upstream: "coingecko",
          resource: "token_historical_prices",
          mode: "stale",
        },
      ]);
    });

    it("slices a longer stored series to the window being asked for", async () => {
      let hits = 0;
      server.use(
        http.get(`${API_URL}/coins/uniswap/market_chart`, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({
                prices: [
                  [1700000000000, 1.0],
                  [1700086400000, 2.0],
                  [1700172800000, 3.0],
                ],
              })
            : new HttpResponse(null, { status: 503 });
        }),
      );

      await service.getHistoricalTokenData(3);
      const { data, degraded } = await service.getHistoricalTokenData(2);

      expect(degraded).toBe(true);
      // The two most recent points of the stored three.
      expect(data).toEqual([
        { price: "2.0000", timestamp: 1700086400 },
        { price: "3.0000", timestamp: 1700172800 },
      ]);
    });

    it("replaces an expired series even when the new one is shorter", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      let hits = 0;
      server.use(
        http.get(`${API_URL}/coins/uniswap/market_chart`, () => {
          hits += 1;
          if (hits === 1)
            return HttpResponse.json({
              prices: [
                [1700000000000, 1.0],
                [1700086400000, 2.0],
              ],
            });
          if (hits === 2)
            return HttpResponse.json({ prices: [[1700172800000, 9.0]] });
          return new HttpResponse(null, { status: 503 });
        }),
      );

      await service.getHistoricalTokenData(2);
      // Past the 24h max age, so the stored two-point series is cold.
      vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1);
      await service.getHistoricalTokenData(1);
      const { data, degraded } = await service.getHistoricalTokenData(1);

      expect(degraded).toBe(true);
      expect(data).toEqual([{ price: "9.0000", timestamp: 1700172800 }]);
      vi.useRealTimers();
    });

    it("does not keep an empty chart as the last good series", async () => {
      let hits = 0;
      server.use(
        http.get(`${API_URL}/coins/uniswap/market_chart`, () => {
          hits += 1;
          if (hits === 1)
            return HttpResponse.json({ prices: [[1700000000000, 5.42]] });
          if (hits === 2) return HttpResponse.json({ prices: [] });
          return new HttpResponse(null, { status: 503 });
        }),
      );

      await service.getHistoricalTokenData(7);
      await service.getHistoricalTokenData(7);
      const { data } = await service.getHistoricalTokenData(7);

      expect(data).toEqual([{ price: "5.4200", timestamp: 1700000000 }]);
    });

    it("returns empty array when API returns no prices", async () => {
      server.use(handleMarketChart("uniswap", { prices: [] }));

      const { data: result } = await service.getHistoricalTokenData(7);

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

  describe("getTokenPrice", () => {
    const PRICE_PATH = `${API_URL}/simple/token_price/ethereum`;

    it("serves the last known price when CoinGecko is unavailable", async () => {
      let hits = 0;
      server.use(
        http.get(PRICE_PATH, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({ "0xabc": { usd: 12.5 } })
            : new HttpResponse(null, { status: 503 });
        }),
      );
      const degraded = captureDegradedUpstream();

      const first = await service.getTokenPrice("0xABC", "usd");
      const second = await service.getTokenPrice("0xABC", "usd");

      expect(first).toEqual({ data: "12.5", degraded: false });
      expect(second).toEqual({ data: "12.5", degraded: true });
      expect(degraded.recorded()).toEqual([
        { upstream: "coingecko", resource: "token_properties", mode: "stale" },
      ]);
    });

    // A USD quote served as ETH would be wrong by three orders of magnitude.
    it("does not serve a stale price quoted in another currency", async () => {
      let hits = 0;
      server.use(
        http.get(PRICE_PATH, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({ "0xabc": { usd: 12.5 } })
            : new HttpResponse(null, { status: 503 });
        }),
      );

      await service.getTokenPrice("0xABC", "usd");

      await expect(
        service.getTokenPrice("0xABC", "eth"),
      ).rejects.toBeInstanceOf(UpstreamUnavailableError);
      // The matching currency still degrades.
      await expect(service.getTokenPrice("0xABC", "usd")).resolves.toEqual({
        data: "12.5",
        degraded: true,
      });
    });

    // Inventing a price would be indistinguishable from a real quote.
    it("throws rather than invent a price when there is nothing to serve", async () => {
      server.use(
        http.get(PRICE_PATH, () => new HttpResponse(null, { status: 503 })),
      );

      await expect(
        service.getTokenPrice("0xABC", "usd"),
      ).rejects.toBeInstanceOf(UpstreamUnavailableError);
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

      const { data: result } = await service.getHistoricalPricesMap(7);

      expect(result).toBeInstanceOf(Map);
      expect(result.get(expectedNormalized)).toBe(5.42);
    });

    it("returns an empty Map when no prices are returned", async () => {
      server.use(handleMarketChart("uniswap", { prices: [] }));

      const { data: result } = await service.getHistoricalPricesMap(7);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});
