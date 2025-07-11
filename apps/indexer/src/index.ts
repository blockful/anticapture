import { createPublicClient, http } from "viem";

import { env } from "@/env";
import { getChain } from "@/lib/utils";
import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ERC20Indexer } from "@/indexer";
import {
  ENSGovernor,
  GovernorIndexer as ENSGovernorIndexer,
} from "@/indexer/ens";
import {
  UNIGovernor,
  GovernorIndexer as UNIGovernorIndexer,
} from "@/indexer/uni";
import { OPGovernor, GovernorIndexer as OPGovernorIndexer } from "@/indexer/op";

const { DAO_ID: daoId, CHAIN_ID: chainId, RPC_URL: rpcUrl } = env;

const chain = getChain(chainId);
if (!chain) {
  throw new Error(`Chain not found for chainId ${chainId}`);
}
console.log("Connected to chain", chain.name);

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

switch (daoId) {
  case DaoIdEnum.ENS: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    ERC20Indexer(daoId, token.address, token.decimals);
    ENSGovernorIndexer(new ENSGovernor(client, governor.address));
    break;
  }
  case DaoIdEnum.UNI: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    ERC20Indexer(daoId, token.address, token.decimals);
    UNIGovernorIndexer(new UNIGovernor(client, governor.address));
    break;
  }
  case DaoIdEnum.OP: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    ERC20Indexer(daoId, token.address, token.decimals);
    OPGovernorIndexer(new OPGovernor(client, governor.address));
    break;
  }
  default:
    throw new Error(`${daoId} Governor unavailable`);
}

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
