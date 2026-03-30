import { createConfig } from "ponder";

import { env } from "@/env";
import { AaveAbi, stkAave, aAave } from "@/indexer/aave";
import { V3AaveAbi } from "@/indexer/aave/abi/aave.v3";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  chains: {
    ethereum_mainnet: {
      id: 1,
      rpc: env.RPC_URLS[0],
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    AAVE: {
      abi: AaveAbi,
      chain: "ethereum_mainnet",
      // https://etherscan.io/token/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      startBlock: 10926829,
    },
    v3AAVE: {
      abi: V3AaveAbi, // delegates indexing only after the upgrade
      chain: "ethereum_mainnet",
      // https://etherscan.io/token/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      startBlock: 18870593,
    },
    stkAAVE: {
      abi: stkAave,
      chain: "ethereum_mainnet",
      // https://etherscan.io/token/0x4da27a545c0c5B758a6BA100e3a049001de870f5
      address: "0x4da27a545c0c5B758a6BA100e3a049001de870f5",
      startBlock: 10927018,
    },
    v3stkAAVE: {
      abi: V3AaveAbi, // delegates indexing only after the upgrade
      chain: "ethereum_mainnet",
      // https://etherscan.io/token/0x4da27a545c0c5B758a6BA100e3a049001de870f5
      address: "0x4da27a545c0c5B758a6BA100e3a049001de870f5",
      startBlock: 18870593,
    },
    aAAVE: {
      abi: aAave,
      chain: "ethereum_mainnet",
      // https://etherscan.io/token/0xA700b4eB416Be35b2911fd5Dee80678ff64fF6C9
      address: "0xA700b4eB416Be35b2911fd5Dee80678ff64fF6C9",
      startBlock: 16496810,
    },
    v3aAAVE: {
      abi: V3AaveAbi, // delegates indexing only after the upgrade
      chain: "ethereum_mainnet",
      // https://etherscan.io/token/0xA700b4eB416Be35b2911fd5Dee80678ff64fF6C9
      address: "0xA700b4eB416Be35b2911fd5Dee80678ff64fF6C9",
      startBlock: 18870593,
    },
  },
});
