import { createConfig } from "ponder";

import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";

export default createConfig({
  chains: {
    anvil: {
      id: 31337,
      rpc: "http://localhost:8545",
      maxRequestsPerSecond: 10,
      pollingInterval: 1000,
      disableCache: true,
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
      address: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
      startBlock: 22635098,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      chain: "anvil",
      address: "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9",
      startBlock: 22635098,
    },
  },
});
