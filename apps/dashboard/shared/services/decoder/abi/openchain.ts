import type { Hex } from "viem";

import { isPresent, isRecord } from "@/shared/services/decoder/guards";

const LOOKUP_URL = "https://api.openchain.xyz/signature-database/v1/lookup";

/**
 * The names a third-party lookup returned for this selector. Nothing about
 * the response is guaranteed, so every level of it is tested on the way down
 * and an unexpected shape reads as "no signatures known".
 */
const signatureNames = (payload: unknown, selector: string): string[] => {
  if (!isRecord(payload) || !isRecord(payload.result)) return [];
  const bySelector = payload.result.function;
  if (!isRecord(bySelector)) return [];
  const entries = bySelector[selector];
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) =>
      isRecord(entry) && typeof entry.name === "string" ? entry.name : null,
    )
    .filter(isPresent);
};

/**
 * All candidate text signatures OpenChain knows for a selector, best-ranked
 * first (`filter=true` drops known junk entries). Empty on any failure, and
 * the decode then degrades to word-guessing, never an exception.
 */
export const fetchSignatures = async (selector: Hex): Promise<string[]> => {
  const params = new URLSearchParams({ function: selector, filter: "true" });
  try {
    // A hung lookup must not pin decode consumers on a loading state.
    const res = await fetch(`${LOOKUP_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    return signatureNames(await res.json(), selector);
  } catch {
    return [];
  }
};
