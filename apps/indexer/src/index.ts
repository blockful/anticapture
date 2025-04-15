import { createPublicClient, http } from "viem";

import { env } from "@/env";
import { getChain } from "@/lib/utils";
import { NetworkEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ArbIndexer } from "@/indexer/arb";
import { EnsIndexer } from "@/indexer/ens";
import { ENSGovernor } from "@/indexer/ens/governor";
import { UniIndexer } from "@/indexer/uni";
import { UNIGovernor } from "@/indexer/uni/governor";

const {
  NETWORK: network,
  DAO_ID: daoId,
  CHAIN_ID: chainId,
  RPC_URL: rpcUrl,
} = env;

const tokenAddress = CONTRACT_ADDRESSES[network][daoId]!.token;
if (!tokenAddress) {
  throw new Error(
    `Token address not found for network ${network} and daoId ${daoId}`,
  );
}

const chain = getChain(chainId);
if (!chain) {
  throw new Error(`Chain not found for chainId ${chainId}`);
}
console.log("Connected to chain", chain.name);

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

switch (network) {
  case NetworkEnum.MAINNET: {
    const ensGovernor = new ENSGovernor(client, tokenAddress);
    EnsIndexer(client, tokenAddress, ensGovernor);
    const uniGovernor = new UNIGovernor(client, tokenAddress);
    UniIndexer(client, tokenAddress, uniGovernor);
    break;
  }
  case NetworkEnum.ARBITRUM: {
    ArbIndexer(client, tokenAddress);
    break;
  }
  default:
    throw new Error(`Unsupported network ${network}`);
}
