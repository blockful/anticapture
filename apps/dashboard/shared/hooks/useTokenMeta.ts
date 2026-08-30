"use client";

import { useMemo } from "react";
import { erc20Abi, type Address } from "viem";
import { useReadContracts } from "wagmi";

import { SUGGESTED_TRANSFER_TOKENS } from "@/shared/constants/suggestedTokens";
import type { TokenMeta } from "@/shared/services/decoder/enrich";

// Curated symbols keyed by lowercase address; decimals always come on-chain
// so the list can never disagree with the token contract.
let curatedSymbols: Map<string, string> | null = null;
const getCuratedSymbol = (token: string): string | undefined => {
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
 * decimals + symbol for the tokens a decoded tree hinted at, read through the
 * app's RPC proxy. Tokens whose decimals cannot be read are simply absent from
 * the map, and the decode renders raw units for them.
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
    if (!data) return map;
    tokens.forEach((token, i) => {
      const decimalsResult = data[2 * i];
      const symbolResult = data[2 * i + 1];
      if (decimalsResult?.status !== "success") return;
      const symbol =
        (symbolResult?.status === "success"
          ? (symbolResult.result as string)
          : undefined) ??
        getCuratedSymbol(token) ??
        "tokens";
      map.set(token.toLowerCase(), {
        decimals: Number(decimalsResult.result),
        symbol,
      });
    });
    return map;
  }, [data, tokens]);

  return { meta, isLoading };
};
