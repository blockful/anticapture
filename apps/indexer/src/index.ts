import { env } from "@/env";
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
import { ARBTokenIndexer } from "@/indexer/arb";
import {
  GovernorIndexer as GTCGovernorIndexer,
  GTCTokenIndexer,
} from "@/indexer/gtc";
import { SCRTokenIndexer, SCRGovernorIndexer } from "@/indexer/scr";
import {
  NounsTokenIndexer,
  GovernorIndexer as NounsGovernorIndexer,
} from "@/indexer/nouns";

const { DAO_ID: daoId } = env;

const blockTime = CONTRACT_ADDRESSES[env.DAO_ID].blockTime;

switch (daoId) {
  case DaoIdEnum.ENS: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    ENSTokenIndexer(token.address, token.decimals);
    ENSGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.UNI: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    UNITokenIndexer(token.address, token.decimals);
    UNIGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.ARB: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    ARBTokenIndexer(token.address, token.decimals);
    break;
  }
  case DaoIdEnum.OP: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    OPTokenIndexer(token.address, token.decimals);
    OPGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.TEST: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    ENSTokenIndexer(token.address, token.decimals, daoId);
    ENSGovernorIndexer(blockTime, daoId);
    break;
  }
  case DaoIdEnum.GTC: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    GTCTokenIndexer(token.address, token.decimals);
    GTCGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.NOUNS: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    NounsTokenIndexer(token.address, token.decimals);
    NounsGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.SCR: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    SCRTokenIndexer(token.address, token.decimals);
    SCRGovernorIndexer(blockTime);
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
