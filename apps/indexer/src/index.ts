import { env } from "@/env";
import { ARBTokenIndexer } from "@/indexer/arb";
import { COMPGovernorIndexer, COMPTokenIndexer } from "@/indexer/comp";
import {
  GovernorIndexer as ENSGovernorIndexer,
  ENSTokenIndexer,
} from "@/indexer/ens";
import {
  GovernorIndexer as GTCGovernorIndexer,
  GTCTokenIndexer,
} from "@/indexer/gtc";
import {
  NounsTokenIndexer,
  GovernorIndexer as NounsGovernorIndexer,
} from "@/indexer/nouns";
import {
  GovernorIndexer as ObolGovernorIndexer,
  ObolTokenIndexer,
} from "@/indexer/obol";
import {
  GovernorIndexer as OPGovernorIndexer,
  OPTokenIndexer,
} from "@/indexer/op";
import { SCRTokenIndexer, SCRGovernorIndexer } from "@/indexer/scr";
import {
  GovernorIndexer as UNIGovernorIndexer,
  UNITokenIndexer,
} from "@/indexer/uni";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { AaveTokenIndexer } from "./indexer/aave/aave";
import {
  ZKTokenIndexer,
  GovernorIndexer as ZKGovernorIndexer,
} from "./indexer/zk";

const { DAO_ID: daoId } = env;

const { token, blockTime } = CONTRACT_ADDRESSES[env.DAO_ID];

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
    break;
  }
  case DaoIdEnum.OP: {
    OPTokenIndexer(token.address, token.decimals);
    OPGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.TEST: {
    ENSTokenIndexer(token.address, token.decimals, daoId);
    ENSGovernorIndexer(blockTime, daoId);
    break;
  }
  case DaoIdEnum.GTC: {
    GTCTokenIndexer(token.address, token.decimals);
    GTCGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.NOUNS: {
    NounsTokenIndexer(token.address, token.decimals);
    NounsGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.SCR: {
    SCRTokenIndexer(token.address, token.decimals);
    SCRGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.COMP: {
    COMPTokenIndexer(token.address, token.decimals);
    COMPGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.OBOL: {
    ObolTokenIndexer(token.address, token.decimals);
    ObolGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.ZK: {
    ZKTokenIndexer(token.address, token.decimals);
    ZKGovernorIndexer(blockTime);
    break;
  }
  case DaoIdEnum.AAVE: {
    AaveTokenIndexer(token.address, token.decimals);
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
