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
  // NOTE: These addresses are deterministic for Anvil local development
  // They are calculated based on deployer address (Alice) + transaction nonce
  // If someone changes the ENS deployment script (DeployENS.sol) or deployment order,
  // these addresses will change and must be updated in CONTRACT_ADDRESSES constant
  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      chain: "anvil",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ANVIL][DaoIdEnum.ENS]!.token.address,
      startBlock: 22635098, // Block where ENS Token was deployed
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      chain: "anvil",
      address: CONTRACT_ADDRESSES[NetworkEnum.ANVIL][DaoIdEnum.ENS]!.governor,
      startBlock: 22635098, // Block where ENS Governor was deployed
    },
  },
});