import { createConfig } from "ponder";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { env } from "@/env";
import { TrueFiGovernorAbi, TrueFiTokenAbi } from "@/indexer/truefi/abi";

const TRUEFI_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.TRUEFI];

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
    TrueFiToken: {
      abi: TrueFiTokenAbi,
      chain: "ethereum_mainnet",
      address: TRUEFI_CONTRACTS.token.address,
      startBlock: TRUEFI_CONTRACTS.token.startBlock,
    },
    TrueFiGovernor: {
      abi: TrueFiGovernorAbi,
      chain: "ethereum_mainnet",
      address: TRUEFI_CONTRACTS.governor.address,
      startBlock: TRUEFI_CONTRACTS.governor.startBlock,
    },
  },
});
