import { createConfig } from "ponder";

import { env } from "@/env";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { GnosisGNOTokenAbi, MainnetGNOTokenAbi } from "@/indexer/gno/abi";

const GNO_CONTRACTS = CONTRACT_ADDRESSES[DaoIdEnum.GNO];

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
    gnosis_mainnet: {
      id: 100,
      rpc: env.GNOSIS_RPC_URL ?? "",
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    GNOToken: {
      abi: MainnetGNOTokenAbi,
      chain: "ethereum_mainnet",
      address: GNO_CONTRACTS.gnoMainnet.address,
      startBlock: GNO_CONTRACTS.gnoMainnet.startBlock,
    },
    GNOTokenGnosis: {
      abi: GnosisGNOTokenAbi,
      chain: "gnosis_mainnet",
      address: GNO_CONTRACTS.gnoGnosis.address,
      startBlock: GNO_CONTRACTS.gnoGnosis.startBlock,
    },
  },
});
