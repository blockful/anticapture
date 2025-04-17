import { Address, createPublicClient, http } from "viem";

import { env } from "@/env";
import { getChain } from "@/lib/utils";
import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { UNIGovernor } from "@/indexer/uni";
import { ERC20Indexer, GovernorIndexer } from "@/indexer";
import { Governor } from "@/interfaces";
import { ENSGovernor } from "@/indexer/ens";

const { NETWORK: network, CHAIN_ID: chainId, RPC_URL: rpcUrl } = env;

const contracts = CONTRACT_ADDRESSES[network];
const chain = getChain(chainId);
if (!chain) {
  throw new Error(`Chain not found for chainId ${chainId}`);
}
console.log("Connected to chain", chain.name);

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

for (const [id, { governor, token }] of Object.entries(contracts)) {
  const daoId = id as DaoIdEnum;

  const governorClient = getGovernorClient(daoId, governor);
  ERC20Indexer(daoId, token.address, token.decimals, governorClient);
  if (governorClient) GovernorIndexer(daoId);
}

function getGovernorClient(
  id: DaoIdEnum,
  address: Address,
): Governor | undefined {
  switch (id) {
    case DaoIdEnum.ENS:
      return new ENSGovernor(client, address);
    case DaoIdEnum.UNI:
      return new UNIGovernor(client, address);
    default:
      return;
  }
}
