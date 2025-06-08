import { createConfig } from "ponder";
import { http } from "viem";

import { env } from "@/env";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    anvil: {
      id: 31337,
      rpc: env.RPC_URL,
      maxRequestsPerSecond: 10,
      pollingInterval: 1000,
    },
  },
  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      chain: "anvil",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ANVIL][DaoIdEnum.ENS]!.token.address,
      startBlock: 1,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      chain: "anvil",
      address: CONTRACT_ADDRESSES[NetworkEnum.ANVIL][DaoIdEnum.ENS]!.governor,
      startBlock: 1,
    },
  },
});