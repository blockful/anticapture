import type { Abi } from "viem";

import { parseAbiStrict } from "@/shared/services/decoder/abi/etherscan";

/**
 * Parses ABI JSON text as either a bare ABI array or a compiler artifact
 * carrying an `abi` key (Hardhat/Foundry output). Returns null on anything
 * else — callers treat null as "not an ABI", never as an exception.
 */
export const parseAbiJson = (text: string): Abi | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parseAbiStrict(parsed);
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { abi?: unknown }).abi)
    ) {
      return parseAbiStrict((parsed as { abi: unknown[] }).abi);
    }
    return null;
  } catch {
    return null;
  }
};
