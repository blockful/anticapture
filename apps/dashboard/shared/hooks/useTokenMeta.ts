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

/** Longest ticker a summary will repeat. Real ones are three to six. */
const TICKER_MAX_CHARS = 12;

const isPrintable = (char: string): boolean => {
  const code = char.codePointAt(0) ?? 0;
  return (
    code > 0x1f &&
    code !== 0x7f &&
    !(code >= 0x80 && code <= 0x9f) &&
    !(code >= 0x200b && code <= 0x200f) &&
    !(code >= 0x2028 && code <= 0x202e)
  );
};

/**
 * A symbol read from an arbitrary contract goes straight into a sentence the
 * reader trusts, so it is treated as the untrusted text it is: a string or
 * nothing, control and bidirectional characters removed, and short enough
 * that it cannot crowd out the sentence around it.
 */
const sanitizeSymbol = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = [...value].filter(isPrintable).join("").trim();
  if (cleaned.length === 0) return undefined;
  return cleaned.length > TICKER_MAX_CHARS
    ? `${cleaned.slice(0, TICKER_MAX_CHARS)}…`
    : cleaned;
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
          ? sanitizeSymbol(symbolResult.result)
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
