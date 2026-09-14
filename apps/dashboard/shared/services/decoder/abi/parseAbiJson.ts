import type { Abi } from "viem";

import { parseAbiStrict } from "@/shared/services/decoder/abi/etherscan";
import { isRecord } from "@/shared/services/decoder/guards";

/**
 * Parses ABI JSON text as either a bare ABI array or a compiler artifact
 * carrying an `abi` key (Hardhat/Foundry output). Returns null on anything
 * else — callers treat null as "not an ABI", never as an exception.
 */
export const parseAbiJson = (text: string): Abi | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    // A bare ABI array, or an artifact carrying one under `abi`. parseAbiStrict
    // tests the shape itself, so neither branch has to assert anything.
    return (
      parseAbiStrict(parsed) ??
      (isRecord(parsed) ? parseAbiStrict(parsed.abi) : null)
    );
  } catch {
    return null;
  }
};
