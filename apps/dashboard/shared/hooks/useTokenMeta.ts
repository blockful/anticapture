"use client";

import { useMemo } from "react";
import { erc20Abi, type Address } from "viem";
import { useReadContracts } from "wagmi";

import { SUGGESTED_TRANSFER_TOKENS } from "@/shared/constants/suggestedTokens";
import type { TokenMeta } from "@/shared/services/decoder/enrich";
import { getKnownTokenMeta } from "@/shared/services/decoder/knownTokens";

// Curated symbols keyed by lowercase address; decimals always come on-chain
// so the list can never disagree with the token contract. The curated list is
// mainnet-only, and the same address on another chain is a different contract,
// so the fallback never crosses chains.
let curatedSymbols: Map<string, string> | null = null;
const getCuratedSymbol = (
  chainId: number,
  token: string,
): string | undefined => {
  if (chainId !== 1) return undefined;
  if (!curatedSymbols) {
    curatedSymbols = new Map();
    for (const tokens of Object.values(SUGGESTED_TRANSFER_TOKENS)) {
      for (const { address, symbol } of tokens) {
        curatedSymbols.set(address.toLowerCase(), symbol);
      }
    }
  }
  return curatedSymbols.get(token.toLowerCase());
};

/**
 * decimals + symbol for the tokens a decoded tree hinted at. Known tokens
 * (governance tokens of supported DAOs, major stables) resolve instantly from
 * a static list so the reader never waits on the RPC proxy for "25,000 USDC";
 * everything else is read on-chain through the app's RPC proxy, and on-chain
 * results overlay the static ones when they arrive. Tokens with neither stay
 * absent from the map and render as raw units.
 */
export const useTokenMeta = (
  chainId: number,
  tokens: Address[],
): { meta: ReadonlyMap<string, TokenMeta>; isLoading: boolean } => {
  const { data, isLoading } = useReadContracts({
    contracts: tokens.flatMap((token) => [
      {
        abi: erc20Abi,
        address: token,
        functionName: "decimals",
        chainId,
      } as const,
      {
        abi: erc20Abi,
        address: token,
        functionName: "symbol",
        chainId,
      } as const,
    ]),
    query: {
      enabled: tokens.length > 0,
      staleTime: Infinity,
      retry: false,
    },
  });

  const meta = useMemo(() => {
    const map = new Map<string, TokenMeta>();
    tokens.forEach((token) => {
      const known = getKnownTokenMeta(chainId, token);
      if (known) map.set(token.toLowerCase(), known);
    });
    if (!data) return map;
    tokens.forEach((token, i) => {
      const decimalsResult = data[2 * i];
      const symbolResult = data[2 * i + 1];
      if (decimalsResult?.status !== "success") return;
      const symbol =
        (symbolResult?.status === "success"
          ? (symbolResult.result as string)
          : undefined) ??
        getCuratedSymbol(chainId, token) ??
        map.get(token.toLowerCase())?.symbol ??
        "tokens";
      map.set(token.toLowerCase(), {
        decimals: Number(decimalsResult.result),
        symbol,
      });
    });
    return map;
  }, [chainId, data, tokens]);

  return { meta, isLoading };
};
