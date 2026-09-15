import { http, HttpResponse } from "msw";
import { HTTPException } from "hono/http-exception";
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

      // 1 ETH * $2500 = $2500.00
      expect(await service.getTokenPrice("token", "dao")).toEqual({
        data: "2500.00",
        degraded: false,
      });
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

      // 0.5 ETH * $2400 = $1200.00, 0.5 ETH * $2500 = $1250.00 (ascending by date)
      expect(await service.getHistoricalTokenData(2, 0)).toEqual({
        data: [
          { price: "1200.00", timestamp: 1705190400 },
          { price: "1250.00", timestamp: 1705276800 },
        ],
        degraded: false,
      });
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

      // 1 ETH * $2500 = 2500 (Map normalized timestamp → USD price)
      expect(await service.getHistoricalPricesMap(1)).toEqual({
        data: new Map([[1705276800, 2500]]),
        degraded: false,
      });
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

    it("quotes the ETH price in the currency the caller asked for", async () => {
      repo.tokenPrice = "1000000000000000000";
      let requested: string | null = null;
      server.use(
        http.get(ETH_MARKET_CHART_URL, ({ request }) => {
          requested = new URL(request.url).searchParams.get("vs_currency");
          return HttpResponse.json({ prices: [[1705276800000, 1]] });
        }),
      );

      expect(await service.getTokenPrice("token", "eth")).toEqual({
        data: "1.00",
        degraded: false,
      });
      expect(requested).toBe("eth");
    });

    // The hand-rolled copy of the classification here missed the 404 branch,
    // so NOUNS and LIL_NOUNS still 502 on a delisted ETH price while every
    // other DAO degraded.
    // The service only classifies; the controller is what degrades. What is
    // asserted is the whole classification the controller will read.
    const classification = async (run: () => Promise<unknown>) => {
      const error: unknown = await run().then(
        () => undefined,
        (rejection: unknown) => rejection,
      );
      if (!(error instanceof UpstreamUnavailableError)) return error;
      return {
        name: error.name,
        upstream: error.upstream,
        reason: error.reason,
        status: error.status,
      };
    };

    it("classifies a 404 on the ETH price call as not_found", async () => {
      repo.tokenPrice = "1000000000000000000";
      server.use(
        http.get(
          ETH_MARKET_CHART_URL,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      expect(
        await classification(() => service.getTokenPrice("token", "usd")),
      ).toEqual({
        name: "UpstreamUnavailableError",
        upstream: "coingecko",
        reason: "not_found",
        status: 503,
      });
    });

    it("classifies a 404 on the historical ETH price call the same way", async () => {
      repo.nftPrices = [
        { price: "1000000000000000000", timestamp: 1705276800 },
      ];
      server.use(
        http.get(
          ETH_MARKET_CHART_RANGE_URL,
          () => new HttpResponse(null, { status: 404 }),
        ),
      );

      expect(
        await classification(() => service.getHistoricalTokenData(1, 0)),
      ).toEqual({
        name: "UpstreamUnavailableError",
        upstream: "coingecko",
        reason: "not_found",
        status: 503,
      });
    });

    // A bad key is fixed by us rather than by waiting, so it stays loud.
    it("keeps a rejected key as a 502 that is not an upstream failure", async () => {
      repo.tokenPrice = "1000000000000000000";
      server.use(
        http.get(
          ETH_MARKET_CHART_URL,
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      const error = await classification(() =>
        service.getTokenPrice("token", "usd"),
      );
      expect(error).toBeInstanceOf(HTTPException);
      expect(error).not.toBeInstanceOf(UpstreamUnavailableError);
      expect((error as HTTPException).status).toBe(502);
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

      expect(await service.getHistoricalTokenData(0, 0)).toEqual({
        data: [],
        degraded: false,
      });
    });
  });
});
