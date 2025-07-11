import { createConfig } from "ponder";

import { env } from "@/env";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

const CONTRACTS = {
  token: {
    address: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    decimals: 18,
    startBlock: 22635098,
  },
  governor: {
    address: "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9",
    startBlock: 22635098,
  },
} as const;

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
      address: CONTRACTS.token.address,
      startBlock: CONTRACTS.token.startBlock, // Block where ENS Token was deployed
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      chain: "anvil",
      address: CONTRACTS.governor.address,
      startBlock: CONTRACTS.governor.startBlock, // Block where ENS Governor was deployed
    },
  },
});
