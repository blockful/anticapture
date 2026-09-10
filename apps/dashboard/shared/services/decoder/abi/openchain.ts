import type { Hex } from "viem";

const LOOKUP_URL = "https://api.openchain.xyz/signature-database/v1/lookup";

type OpenchainResponse = {
  result?: {
    function?: Record<string, Array<{ name: string }> | null>;
  };
};

/**
 * All candidate text signatures OpenChain knows for a selector, best-ranked
 * first (`filter=true` drops known junk entries). Empty on any failure — the
 * decode then degrades to word-guessing, never an exception.
 */
export const fetchSignatures = async (selector: Hex): Promise<string[]> => {
  const params = new URLSearchParams({ function: selector, filter: "true" });
  try {
    // A hung lookup must not pin decode consumers on a loading state.
    const res = await fetch(`${LOOKUP_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as OpenchainResponse;
    const entries = json.result?.function?.[selector] ?? [];
    return (entries ?? []).map((entry) => entry.name);
  } catch {
    return [];
  }
};
