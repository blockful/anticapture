import { createConfig } from "ponder";
import { http } from "viem";

import "@/env";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: "postgresql://postgres:admin@localhost:5432/postgres",
  },
  networks: {
    anvil: {
      chainId: 31337,
      transport: http("http://localhost:8545"),
    },
  },
  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      network: "anvil",
      address:
        CONTRACT_ADDRESSES[NetworkEnum.ANVIL][DaoIdEnum.ENS]!.token.address,
      startBlock: 0,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      network: "anvil",
      address: CONTRACT_ADDRESSES[NetworkEnum.ANVIL][DaoIdEnum.ENS]!.governor,
      startBlock: 0,
    },
  },
});
