import type { Address } from "viem";

import daoConfigByDaoId from "@/shared/dao-config";
import type { TokenMeta } from "@/shared/services/decoder/enrich";

/**
 * Offline decimals for the handful of tokens governance proposals actually
 * move. On-chain reads stay authoritative and overlay these; the list only
 * keeps the reader from ever seeing "(raw units)" when the RPC proxy is slow,
 * unconfigured or down. Keyed by chain, then lowercase address.
 */
const CURATED: Record<number, Record<string, TokenMeta>> = {
  1: {
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
      symbol: "USDC",
      decimals: 6,
    },
    "0xdac17f958d2ee523a2206206994597c13d831ec7": {
      symbol: "USDT",
      decimals: 6,
    },
    "0x6b175474e89094c44da98b954eedeac495271d0f": {
      symbol: "DAI",
      decimals: 18,
    },
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
      symbol: "WETH",
      decimals: 18,
    },
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": {
      symbol: "stETH",
      decimals: 18,
    },
    "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": {
      symbol: "wstETH",
      decimals: 18,
    },
    "0xae78736cd615f374d3085123a210448e74fc6393": {
      symbol: "rETH",
      decimals: 18,
    },
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
      symbol: "WBTC",
      decimals: 8,
    },
  },
  10: {
    "0x0b2c639c533813f4aa9d7837caf62653d097ff85": {
      symbol: "USDC",
      decimals: 6,
    },
    "0x4200000000000000000000000000000000000006": {
      symbol: "WETH",
      decimals: 18,
    },
  },
};

let governanceTokens: Map<string, TokenMeta> | null = null;

/** Every supported DAO's ERC-20 governance token, keyed `chainId:address`. */
const getGovernanceTokens = (): Map<string, TokenMeta> => {
  if (governanceTokens) return governanceTokens;
  governanceTokens = new Map();
  for (const config of Object.values(daoConfigByDaoId)) {
    const overview = config?.daoOverview;
    if (!overview || overview.token !== "ERC20") continue;
    const chainId = overview.chain?.id;
    const token = overview.contracts?.token;
    if (chainId === undefined || !token || typeof config.decimals !== "number")
      continue;
    const addresses = Array.isArray(token)
      ? token.map((entry) => entry.address)
      : [token];
    for (const address of addresses) {
      governanceTokens.set(`${chainId}:${address.toLowerCase()}`, {
        symbol: config.name,
        decimals: config.decimals,
      });
    }
  }
  return governanceTokens;
};

/** Static metadata for a token, or undefined when it is not curated. */
export const getKnownTokenMeta = (
  chainId: number,
  token: Address | string,
): TokenMeta | undefined => {
  const key = token.toLowerCase();
  return (
    CURATED[chainId]?.[key] ?? getGovernanceTokens().get(`${chainId}:${key}`)
  );
};
