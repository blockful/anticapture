import { createConfig } from "ponder";
import { http } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

import { env } from "@/env";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  networks: {
    ethereum_mainnet: {
      chainId: 1,
      transport: http(env.RPC_URL),
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      network: "ethereum_mainnet",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM][DaoIdEnum.ENS]!.token.address,
      startBlock: 9380410,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      network: "ethereum_mainnet",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM][DaoIdEnum.ENS]!.governor,
      startBlock: 13533772,
    },
  },
});
