import type { Address } from "viem";

import { humanizeTokenAmount } from "@/shared/services/decoder/humanize/tokenAmount";
import { summarize } from "@/shared/services/decoder/summarize";
import type {
  DecodedCall,
  DecodedParam,
} from "@/shared/services/decoder/types";

export type TokenMeta = { decimals: number; symbol: string };

const collectFromParams = (params: DecodedParam[], into: Set<string>) => {
  for (const param of params) {
    if (param.tokenHint) into.add(param.tokenHint.token.toLowerCase());
    if (param.children) collectFromParams(param.children, into);
  }
};

/** Every token address the tree wants metadata for, lowercased and unique. */
export const collectTokenHints = (node: DecodedCall): Address[] => {
  const found = new Set<string>();
  const walk = (call: DecodedCall) => {
    collectFromParams(call.params, found);
    call.subcalls?.forEach(walk);
  };
  walk(node);
  return [...found] as Address[];
};

const enrichParam = (
  param: DecodedParam,
  meta: ReadonlyMap<string, TokenMeta>,
): DecodedParam => {
  const children = param.children?.map((child) => enrichParam(child, meta));
  const token = param.tokenHint
    ? meta.get(param.tokenHint.token.toLowerCase())
    : undefined;
  if (!token && children === param.children) return param;
  return {
    ...param,
    ...(children ? { children } : {}),
    ...(token
      ? {
          humanized: humanizeTokenAmount(
            BigInt(param.value),
            token.decimals,
            token.symbol,
          ),
        }
      : {}),
  };
};

/**
 * Immutably overlays token metadata onto a decoded tree: hinted amounts gain
 * their "25,000 USDC" reading and summaries are recomputed with it. Decode
 * never waits for this; the UI applies it when the metadata query settles.
 */
export const applyTokenMeta = (
  node: DecodedCall,
  meta: ReadonlyMap<string, TokenMeta>,
): DecodedCall => {
  const enriched: DecodedCall = {
    ...node,
    params: node.params.map((param) => enrichParam(param, meta)),
    subcalls: node.subcalls?.map((subcall) => ({
      ...applyTokenMeta(subcall, meta),
      index: subcall.index,
    })),
  };
  enriched.summary = summarize(enriched);
  return enriched;
};
