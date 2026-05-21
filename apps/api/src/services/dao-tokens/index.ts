import axios, { AxiosInstance } from "axios";
import { z } from "zod";

import { DaoIdEnum } from "@/lib/enums";
import type { DaoTokenItem } from "@/mappers/token";
import { AssetPlatformEnum } from "@/services/coingecko/types";

interface TokenRegistryItem {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  coingeckoId: string;
}

const DaoIdToPlatform: Record<DaoIdEnum, AssetPlatformEnum> = {
  [DaoIdEnum.AAVE]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.ENS]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.UNI]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.ARB]: AssetPlatformEnum.ARBITRUM,
  [DaoIdEnum.OP]: AssetPlatformEnum.OPTIMISM,
  [DaoIdEnum.GTC]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.LIL_NOUNS]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.NOUNS]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.SCR]: AssetPlatformEnum.SCROLL,
  [DaoIdEnum.COMP]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.OBOL]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.ZK]: AssetPlatformEnum.ZKSYNC,
  [DaoIdEnum.SHU]: AssetPlatformEnum.ETHEREUM,
  [DaoIdEnum.FLUID]: AssetPlatformEnum.ETHEREUM,
};

const TOKEN_REGISTRY: Record<AssetPlatformEnum, TokenRegistryItem[]> = {
  [AssetPlatformEnum.ETHEREUM]: [
    {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      coingeckoId: "dai",
    },
    {
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      coingeckoId: "wrapped-bitcoin",
    },
    {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x514910771af9ca656af840dff83e8264ecf986ca",
      symbol: "LINK",
      name: "ChainLink Token",
      decimals: 18,
      coingeckoId: "chainlink",
    },
    {
      address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
      coingeckoId: "uniswap",
    },
    {
      address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      symbol: "AAVE",
      name: "Aave",
      decimals: 18,
      coingeckoId: "aave",
    },
    {
      address: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      symbol: "COMP",
      name: "Compound",
      decimals: 18,
      coingeckoId: "compound-governance-token",
    },
    {
      address: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72",
      symbol: "ENS",
      name: "Ethereum Name Service",
      decimals: 18,
      coingeckoId: "ethereum-name-service",
    },
    {
      address: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
      symbol: "GTC",
      name: "Gitcoin",
      decimals: 18,
      coingeckoId: "gitcoin",
    },
    {
      address: "0x0b010000b7624eb9b3dfbc279673c76e9d29d5f7",
      symbol: "OBOL",
      name: "Obol",
      decimals: 18,
      coingeckoId: "obol-2",
    },
    {
      address: "0xe485e2f1bab389c08721b291f6b59780fec83fd7",
      symbol: "SHU",
      name: "Shutter Network",
      decimals: 18,
      coingeckoId: "shutter",
    },
    {
      address: "0x6f40d4a6237c257fff2db00fa0510deeecd303eb",
      symbol: "FLUID",
      name: "Fluid",
      decimals: 18,
      coingeckoId: "fluid",
    },
  ],
  [AssetPlatformEnum.ARBITRUM]: [
    {
      address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
      symbol: "ARB",
      name: "Arbitrum",
      decimals: 18,
      coingeckoId: "arbitrum",
    },
    {
      address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      coingeckoId: "wrapped-bitcoin",
    },
    {
      address: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
      symbol: "LINK",
      name: "ChainLink Token",
      decimals: 18,
      coingeckoId: "chainlink",
    },
  ],
  [AssetPlatformEnum.OPTIMISM]: [
    {
      address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x4200000000000000000000000000000000000042",
      symbol: "OP",
      name: "Optimism",
      decimals: 18,
      coingeckoId: "optimism",
    },
    {
      address: "0x68f180fcce6836688e9084f035309e29bf0a2095",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      coingeckoId: "wrapped-bitcoin",
    },
    {
      address: "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6",
      symbol: "LINK",
      name: "ChainLink Token",
      decimals: 18,
      coingeckoId: "chainlink",
    },
  ],
  [AssetPlatformEnum.SCROLL]: [
    {
      address: "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0xf55bec9cafdbee730f096aa55dad6d22d44099df",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x5300000000000000000000000000000000000004",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0xd29687c813d741e2f938f4ac377128810e217b1b",
      symbol: "SCR",
      name: "Scroll",
      decimals: 18,
      coingeckoId: "scroll",
    },
  ],
  [AssetPlatformEnum.ZKSYNC]: [
    {
      address: "0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      coingeckoId: "usd-coin",
    },
    {
      address: "0x493257fd37edb34451f62edf8d2a0c418852ba4c",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      coingeckoId: "tether",
    },
    {
      address: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      coingeckoId: "weth",
    },
    {
      address: "0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e",
      symbol: "ZK",
      name: "zkSync",
      decimals: 18,
      coingeckoId: "zksync",
    },
  ],
};

const CoingeckoMarketItemSchema = z.object({
  id: z.string(),
  image: z.string().nullable().optional(),
  current_price: z.number().nullable().optional(),
  price_change_percentage_24h: z.number().nullable().optional(),
});

export class DaoTokensService {
  private readonly client: AxiosInstance;
  private readonly platform: AssetPlatformEnum;

  constructor(
    coingeckoApiUrl: string,
    coingeckoApiKey: string,
    daoId: DaoIdEnum,
  ) {
    this.client = axios.create({
      baseURL: coingeckoApiUrl,
      headers: { "x-cg-demo-api-key": coingeckoApiKey },
    });
    this.platform = DaoIdToPlatform[daoId];
  }

  async getAvailableTokens(): Promise<DaoTokenItem[]> {
    const tokens = TOKEN_REGISTRY[this.platform] ?? [];
    if (tokens.length === 0) return [];

    const uniqueIds = [...new Set(tokens.map((t) => t.coingeckoId))].join(",");

    try {
      const response = await this.client.get(
        `/coins/markets?vs_currency=usd&ids=${uniqueIds}&per_page=100&sparkline=false`,
      );

      const marketItems = z
        .array(CoingeckoMarketItemSchema)
        .parse(response.data);
      const marketMap = new Map(marketItems.map((item) => [item.id, item]));

      return tokens.map((token) => {
        const market = marketMap.get(token.coingeckoId);
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoUri: market?.image ?? null,
          price: market?.current_price ?? null,
          priceChange24h: market?.price_change_percentage_24h ?? null,
        };
      });
    } catch {
      return tokens.map((token) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUri: null,
        price: null,
        priceChange24h: null,
      }));
    }
  }
}
