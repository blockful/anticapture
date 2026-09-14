import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { captureDegradedUpstream } from "@/lib/degraded-upstream.test-support";
import { UpstreamUnavailableError } from "@/lib/upstream-error";
import { TokenHistoricalPriceResponse } from "@/mappers";
import { NFTPriceService } from "./index";

const COINGECKO_URL = "https://api.coingecko.com";
const COINGECKO_KEY = "test-key";
const ETH_MARKET_CHART_URL = `${COINGECKO_URL}/coins/ethereum/market_chart`;
const ETH_MARKET_CHART_RANGE_URL = `${COINGECKO_URL}/coins/ethereum/market_chart/range`;

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createStubRepo() {
  const stub = {
    nftPrices: [] as TokenHistoricalPriceResponse,
    tokenPrice: "0",

    getHistoricalNFTPrice: async () => stub.nftPrices,
    getTokenPrice: async () => stub.tokenPrice,
  };
  return stub;
}

describe("NFTPriceService", () => {
  let service: NFTPriceService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

    repo = createStubRepo();
    service = new NFTPriceService(repo, COINGECKO_URL, COINGECKO_KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getTokenPrice", () => {
    it("should return USD price (NFT ETH price * ETH USD price)", async () => {
      // NFT price in wei: 1 ETH = 1000000000000000000
      repo.tokenPrice = "1000000000000000000";

      server.use(
        http.get(ETH_MARKET_CHART_URL, () =>
          HttpResponse.json({ prices: [[1705315200000, 2500.0]] }),
        ),
      );

      const { data: result } = await service.getTokenPrice("token", "dao");

      // 1 ETH * $2500 = $2500.00
      expect(result).toBe("2500.00");
    });
  });

  describe("getHistoricalTokenData", () => {
    it("should combine NFT and ETH prices", async () => {
      // NFT prices in wei (0.5 ETH each)
      repo.nftPrices = [
        { price: "500000000000000000", timestamp: 1705276800 },
        { price: "500000000000000000", timestamp: 1705190400 },
      ];

      // ETH prices (reversed, so most recent first)
      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () =>
          HttpResponse.json({
            prices: [
              [1705190400000, 2400.0],
              [1705276800000, 2500.0],
            ],
          }),
        ),
      );

      const { data: result } = await service.getHistoricalTokenData(2, 0);

      // 0.5 ETH * $2400 = $1200.00, 0.5 ETH * $2500 = $1250.00 (ascending by date)
      expect(result).toEqual([
        { price: "1200.00", timestamp: 1705190400 },
        { price: "1250.00", timestamp: 1705276800 },
      ]);
    });
  });

  describe("getHistoricalPricesMap", () => {
    it("should return a Map of timestamp to price", async () => {
      repo.nftPrices = [
        { price: "1000000000000000000", timestamp: 1705276800 },
      ];

      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () =>
          HttpResponse.json({ prices: [[1705276800000, 2500.0]] }),
        ),
      );

      const { data: result } = await service.getHistoricalPricesMap(1);

      // 1 ETH * $2500 = 2500 (Map normalized timestamp → USD price)
      expect(result).toEqual(new Map([[1705276800, 2500]]));
    });
  });

  describe("failure classification", () => {
    it("tags a CoinGecko failure as an upstream failure", async () => {
      repo.nftPrices = [
        { price: "1000000000000000000", timestamp: 1705276800 },
      ];
      server.use(
        http.get(
          ETH_MARKET_CHART_RANGE_URL,
          () => new HttpResponse(null, { status: 502 }),
        ),
      );

      await expect(service.getHistoricalTokenData(1, 0)).rejects.toMatchObject({
        upstream: "coingecko",
      });
    });

    it.each([
      ["a missing prices key", {}],
      ["prices that are not an array", { prices: "nope" }],
      ["tuples with the wrong types", { prices: [["nope", 1]] }],
    ])("tags %s as an upstream failure", async (_label, body) => {
      repo.nftPrices = [
        { price: "1000000000000000000", timestamp: 1705276800 },
      ];
      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () => HttpResponse.json(body)),
      );

      await expect(service.getHistoricalTokenData(1, 0)).rejects.toMatchObject({
        upstream: "coingecko",
      });
    });

    // Previously a short series made the mapping read undefined and blew up
    // outside the classified path, so it surfaced as a 500.
    it("tags a series shorter than the mapping needs as an upstream failure", async () => {
      repo.nftPrices = [
        { price: "1000000000000000000", timestamp: 1705190400 },
        { price: "1000000000000000000", timestamp: 1705276800 },
      ];
      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () =>
          HttpResponse.json({ prices: [[1705276800000, 2500.0]] }),
        ),
      );

      await expect(service.getHistoricalTokenData(2, 0)).rejects.toBeInstanceOf(
        UpstreamUnavailableError,
      );
    });

    it("tags an empty current price series as an upstream failure", async () => {
      repo.tokenPrice = "1000000000000000000";
      server.use(
        http.get(ETH_MARKET_CHART_URL, () => HttpResponse.json({ prices: [] })),
      );

      await expect(service.getTokenPrice("", "")).rejects.toMatchObject({
        upstream: "coingecko",
      });
    });

    // NOUNS and LIL_NOUNS used to 503 on /token while every other DAO degraded.
    it("serves the last known spot price when CoinGecko fails", async () => {
      repo.tokenPrice = "1000000000000000000";
      let hits = 0;
      server.use(
        http.get(ETH_MARKET_CHART_URL, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({ prices: [[1705276800000, 2500.0]] })
            : new HttpResponse(null, { status: 503 });
        }),
      );
      const degraded = captureDegradedUpstream();

      await service.getTokenPrice("token", "usd");
      const second = await service.getTokenPrice("token", "usd");

      expect(second).toEqual({ data: "2500.00", degraded: true });
      expect(degraded.recorded()).toEqual([
        {
          upstream: "coingecko",
          resource: "token_properties",
          mode: "stale",
          reason: "unavailable",
        },
      ]);
    });

    it("does not reuse a spot price across currencies", async () => {
      repo.tokenPrice = "1000000000000000000";
      let hits = 0;
      server.use(
        http.get(ETH_MARKET_CHART_URL, () => {
          hits += 1;
          return hits === 1
            ? HttpResponse.json({ prices: [[1705276800000, 2500.0]] })
            : new HttpResponse(null, { status: 503 });
        }),
      );

      await service.getTokenPrice("token", "usd");

      await expect(
        service.getTokenPrice("token", "eth"),
      ).rejects.toBeInstanceOf(UpstreamUnavailableError);
    });

    it("propagates a database failure rather than serving a stale price", async () => {
      const dbError = new Error("relation token_price does not exist");
      repo.getTokenPrice = async () => {
        throw dbError;
      };

      await expect(service.getTokenPrice("token", "usd")).rejects.toBe(dbError);
    });

    // The route degrades only on UpstreamUnavailableError, so a database error
    // has to come back untouched rather than as an empty 200.
    it("propagates a repository failure untouched", async () => {
      const dbError = new Error("connection terminated unexpectedly");
      repo.getHistoricalNFTPrice = async () => {
        throw dbError;
      };
      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () =>
          HttpResponse.json({ prices: [[1705276800000, 2500.0]] }),
        ),
      );

      await expect(service.getHistoricalTokenData(1, 0)).rejects.toBe(dbError);
      await expect(
        service.getHistoricalTokenData(1, 0),
      ).rejects.not.toBeInstanceOf(UpstreamUnavailableError);
    });

    it("propagates a repository failure from getTokenPrice untouched", async () => {
      const dbError = new Error("relation token_price does not exist");
      repo.getTokenPrice = async () => {
        throw dbError;
      };

      await expect(service.getTokenPrice("", "")).rejects.toBe(dbError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty NFT data", async () => {
      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () =>
          HttpResponse.json({ prices: [] }),
        ),
      );

      const { data: result } = await service.getHistoricalTokenData(0, 0);

      expect(result).toEqual([]);
    });
  });
});
