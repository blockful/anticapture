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

  return (normalizedBase - normalizedVariation
    ? Number(
      (normalizedVariation * 10000n) /
      (normalizedBase - normalizedVariation),
    ) / 100
    : 0
  ).toString()
}
