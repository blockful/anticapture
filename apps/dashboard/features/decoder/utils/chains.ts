import daoConfigByDaoId from "@/shared/dao-config";

export const DEFAULT_DECODER_CHAIN_ID = 1;

let chains: Array<{ id: number; name: string }> | null = null;

/** The chains the platform indexes, which are the only ones the decoder has
 *  an explorer and an ABI proxy for. */
export const supportedDecoderChains = (): Array<{
  id: number;
  name: string;
}> => {
  if (chains) return chains;
  const byId = new Map<number, string>();
  for (const config of Object.values(daoConfigByDaoId)) {
    const chain = config?.daoOverview?.chain;
    if (chain && !byId.has(chain.id)) byId.set(chain.id, chain.name);
  }
  chains = [...byId.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, name]) => ({ id, name }));
  return chains;
};

export const isSupportedChainId = (value: number): boolean =>
  supportedDecoderChains().some((chain) => chain.id === value);

/**
 * The chain id from the URL is whatever someone typed there, and it reaches
 * the ABI proxy as a query parameter. Anything the platform does not index
 * reads as mainnet rather than being forwarded upstream.
 */
export const toSupportedChainId = (value: number): number =>
  isSupportedChainId(value) ? value : DEFAULT_DECODER_CHAIN_ID;
