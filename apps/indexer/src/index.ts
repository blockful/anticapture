import { Address, createPublicClient, http } from "viem";

import { env } from "@/env";
import { getChain } from "@/lib/utils";
import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ERC20Indexer, GovernorIndexer } from "@/indexer";
import { Governor } from "@/interfaces";
import { ENSGovernor } from "@/indexer/ens";
import { UNIGovernor } from "@/indexer/uni";

const {
  NETWORK: network,
  DAO_ID: daoId,
  CHAIN_ID: chainId,
  RPC_URL: rpcUrl,
} = env;

const chain = getChain(chainId);
if (!chain) {
  throw new Error(`Chain not found for chainId ${chainId}`);
}
console.log("Connected to chain", chain.name);

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

const { token, governor } = CONTRACT_ADDRESSES[network][daoId]!;

ERC20Indexer(daoId, token.address, token.decimals);
if (governor) GovernorIndexer(daoId, getGovernorClient(daoId, governor));

function getGovernorClient(id: DaoIdEnum, address: Address): Governor {
  switch (id) {
    case DaoIdEnum.ENS:
      return new ENSGovernor(client, address);
    case DaoIdEnum.UNI:
      return new UNIGovernor(client, address);
    default:
      throw new Error(`${id} Governor unavailable`);
  }
}

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
