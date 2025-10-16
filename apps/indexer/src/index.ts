import { createPublicClient, http } from "viem";

import { env } from "@/env";
import { getChain } from "@/lib/utils";
import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  ENSClient,
  GovernorIndexer as ENSGovernorIndexer,
  ENSTokenIndexer,
} from "@/indexer/ens";
import {
  UNIClient,
  GovernorIndexer as UNIGovernorIndexer,
  UNITokenIndexer,
} from "@/indexer/uni";
import {
  OPClient,
  GovernorIndexer as OPGovernorIndexer,
  OPTokenIndexer,
} from "@/indexer/op";
import { ARBTokenIndexer } from "@/indexer/arb";
import { GTCClient } from "@/indexer/gtc/client";
import { GTCTokenIndexer } from "@/indexer/gtc/erc20";
import { GovernorIndexer as GTCGovernorIndexer } from "@/indexer/gtc/governor";
import { SCRTokenIndexer, SCRGovernorIndexer, SCRClient } from "./indexer/scr";

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

const blockTime = CONTRACT_ADDRESSES[env.DAO_ID].blockTime;

switch (daoId) {
  case DaoIdEnum.ENS: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    ENSTokenIndexer(token.address, token.decimals);
    ENSGovernorIndexer(new ENSClient(client, governor.address), blockTime);
    break;
  }
  case DaoIdEnum.UNI: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    UNITokenIndexer(token.address, token.decimals);
    UNIGovernorIndexer(new UNIClient(client, governor.address), blockTime);
    break;
  }
  case DaoIdEnum.ARB: {
    const { token } = CONTRACT_ADDRESSES[daoId];
    ARBTokenIndexer(token.address, token.decimals);
    break;
  }
  case DaoIdEnum.OP: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    OPTokenIndexer(token.address, token.decimals);
    OPGovernorIndexer(new OPClient(client, governor.address), blockTime);
    break;
  }
  case DaoIdEnum.TEST: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    ENSTokenIndexer(token.address, token.decimals, daoId);
    ENSGovernorIndexer(
      new ENSClient(client, governor.address),
      blockTime,
      daoId,
    );
    break;
  }
  case DaoIdEnum.GTC: {
    const { token, governor } = CONTRACT_ADDRESSES[daoId];
    GTCTokenIndexer(token.address, token.decimals);
    GTCGovernorIndexer(new GTCClient(client, governor.address), blockTime);
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
