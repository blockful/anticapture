import * as chains from "viem/chains";

/**
 * Calculates the absolute difference between two numbers
 */
export function delta(a: bigint, b: bigint): bigint {
  return a > b ? a - b : b - a;
}

/**
 * Returns the minimum of two or more numbers
 */
export function min(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error("At least one value must be provided");
  }
  return values.reduce((min, value) => (value < min ? value : min));
}

/**
 * Returns the maximum of two or more numbers
 */
export function max(...values: bigint[]): bigint {
  if (values.length === 0) {
    throw new Error("At least one value must be provided");
  }
  return values.reduce((max, value) => (value > max ? value : max));
}

export function getChain(chainId: number): chains.Chain | undefined {
  return Object.values(chains).find((chain) => chain.id === chainId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function containsAnyValue(data: Record<string, any>): boolean {
  return Object.keys(data).some((key) => {
    const value = data[key];
    if (value === null || value === undefined) return false;
    if (typeof value === "object" && Object.keys(value).length === 0)
      return false;
    return true;
  });
}
