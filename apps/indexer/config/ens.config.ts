import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

import { env } from "@/env";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

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
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM][DaoIdEnum.ENS]!.token.address,
      startBlock: 9380410,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      chain: "ethereum_mainnet",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM][DaoIdEnum.ENS]!.governor,
      startBlock: 13533772,
    },
  },
});
