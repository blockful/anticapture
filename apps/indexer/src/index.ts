import { env } from "@/env";
import { getChain } from "@/lib/utils";
import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  GovernorIndexer as ENSGovernorIndexer,
  ENSTokenIndexer,
} from "@/indexer/ens";
import {
  GovernorIndexer as UNIGovernorIndexer,
  UNITokenIndexer,
} from "@/indexer/uni";
import {
  GovernorIndexer as OPGovernorIndexer,
  OPTokenIndexer,
} from "@/indexer/op";
import {
  ARBTokenIndexer,
  GovernorIndexer as ARBGovernorIndexer,
} from "./indexer/arb";

const { DAO_ID: daoId, CHAIN_ID: chainId } = env;

const chain = getChain(chainId);
if (!chain) {
  throw new Error(`Chain not found for chainId ${chainId}`);
}
console.log("Connected to chain", chain.name);

const { token, blockTime } = CONTRACT_ADDRESSES[daoId];
switch (daoId) {
  case DaoIdEnum.ENS: {
    ENSTokenIndexer(token.address, token.decimals);
    ENSGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.UNI: {
    UNITokenIndexer(token.address, token.decimals);
    UNIGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.ARB: {
    ARBTokenIndexer(token.address, token.decimals);
    ARBGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.OP: {
    OPTokenIndexer(token.address, token.decimals);
    OPGovernorIndexer(blockTime);
    break;
  }
  default:
    throw new Error(`DAO ${daoId} not supported`);
}

//@ts-expect-error ignore linting error
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
