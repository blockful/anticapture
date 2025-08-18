import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

const ENS_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.ENS];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      chain: "ethereum_mainnet",
      address: ENS_CONTRACTS.token.address,
      startBlock: ENS_CONTRACTS.token.startBlock,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      chain: "ethereum_mainnet",
      address: ENS_CONTRACTS.governor.address,
      startBlock: ENS_CONTRACTS.governor.startBlock,
    },
  },
});
