import { type PublicClient } from "viem";

/**
 * Creates a minimal stub PublicClient that satisfies the interface.
 * Use setReadContractResult() / setGetBalanceResult() to control return values.
 */
export function createStubPublicClient() {
  let readContractResult: unknown = undefined;
  let getBalanceResult: bigint = 0n;

  const stub = {
    readContract: async () => readContractResult,
    getBalance: async () => getBalanceResult,
    setReadContractResult(value: unknown) {
      readContractResult = value;
    },
    setGetBalanceResult(value: bigint) {
      getBalanceResult = value;
    },
  } as unknown as PublicClient & {
    setReadContractResult(value: unknown): void;
    setGetBalanceResult(value: bigint): void;
  };

  return stub;
}
