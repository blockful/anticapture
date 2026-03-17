import * as chains from "viem/chains";

export function getChain(chainId: number): chains.Chain | undefined {
  return Object.values(chains).find((chain) => chain.id === chainId);
}

export function calculatePercentage(
  baseValue: number | string | bigint,
  variation: number | string | bigint,
): string {
  const normalizedBase = BigInt(baseValue);
  const normalizedVariation = BigInt(variation);
  const previous = normalizedBase - normalizedVariation;

  if (!previous) return "0";

  const absPrevious = previous < 0n ? -previous : previous;
  return (
    Number((normalizedVariation * 10000n) / absPrevious) / 100
  ).toString();
}
