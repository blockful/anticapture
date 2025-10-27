import { createPublicClient, http } from "viem";

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
} from "@/indexer/arb";
import {
  GovernorIndexer as GTCGovernorIndexer,
  GTCTokenIndexer,
} from "@/indexer/gtc";
import { SCRTokenIndexer, SCRGovernorIndexer, SCRClient } from "@/indexer/scr";
import {
  NounsTokenIndexer,
  GovernorIndexer as NounsGovernorIndexer,
  Client as NounsClient,
} from "@/indexer/nouns";
import { getClient } from "@/lib/client";

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

const daoClient = getClient(daoId, client);
if (!daoClient) {
  throw new Error(`DAO client not found for DAO ${daoId}`);
}

const { token, blockTime } = CONTRACT_ADDRESSES[daoId];
switch (daoId) {
  case DaoIdEnum.ENS: {
    ENSTokenIndexer(token.address, token.decimals);
    ENSGovernorIndexer(daoClient, blockTime);
    break;
  }
  case DaoIdEnum.UNI: {
    UNITokenIndexer(token.address, token.decimals);
    UNIGovernorIndexer(daoClient, blockTime);
    break;
  }
  case DaoIdEnum.ARB: {
    ARBTokenIndexer(token.address, token.decimals);
    ARBGovernorIndexer(daoClient, blockTime);
    break;
  }
  case DaoIdEnum.OP: {
    OPTokenIndexer(token.address, token.decimals);
    OPGovernorIndexer(daoClient, blockTime);
    break;
  }
  case DaoIdEnum.TEST: {
    ENSTokenIndexer(token.address, token.decimals, daoId);
    ENSGovernorIndexer(daoClient, blockTime);
    break;
  }
  case DaoIdEnum.GTC: {
    GTCTokenIndexer(token.address, token.decimals);
    GTCGovernorIndexer(daoClient, blockTime);
    break;
  }
  case DaoIdEnum.NOUNS: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    NounsTokenIndexer(token.address, token.decimals);
    NounsGovernorIndexer(
      new NounsClient(client, governor.address),
      blockTime,
      token.address,
    );
    break;
  }
  case DaoIdEnum.SCR: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    SCRTokenIndexer(token.address, token.decimals);
    SCRGovernorIndexer(new SCRClient(client, governor.address), blockTime);
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
