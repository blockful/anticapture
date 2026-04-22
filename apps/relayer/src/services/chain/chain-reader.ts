import type { PublicActions } from "viem";

/**
 * Narrow interface covering only the viem actions our services use.
 * A real PublicClient satisfies this via structural subtyping.
 */
export type ChainReader = Pick<
  PublicActions,
  "readContract" | "getBalance" | "simulateContract"
>;
