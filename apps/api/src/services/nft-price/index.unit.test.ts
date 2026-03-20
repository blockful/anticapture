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
import { TokenHistoricalPriceResponse } from "@/mappers";
import { NFTPriceService } from "./index";

const COINGECKO_URL = "https://api.coingecko.com/api/v3";
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

      const result = await service.getTokenPrice("token", "dao");

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

      const result = await service.getHistoricalTokenData(2, 0);

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

      const result = await service.getHistoricalPricesMap(1);

      // 1 ETH * $2500 = 2500 (Map normalized timestamp → USD price)
      expect(result).toEqual(new Map([[1705276800, 2500]]));
    });
  });

  describe("edge cases", () => {
    it("should handle empty NFT data", async () => {
      server.use(
        http.get(ETH_MARKET_CHART_RANGE_URL, () =>
          HttpResponse.json({ prices: [] }),
        ),
      );

      const result = await service.getHistoricalTokenData(0, 0);

      expect(result).toEqual([]);
    });
  });
});
