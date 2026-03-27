import { createConfig } from "ponder";

import { env } from "@/env";
import {
  GnosisChainGno,
  GnosisChainLGno,
  GnosisChainSGno,
} from "@/indexer/gnosis/abi/gnosis-chain";
import { MainnetGno, MainnetLGno } from "@/indexer/gnosis/abi/ethereum-mainnet";

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
    gnosis_chain: {
      id: 100,
      rpc: env.RPC_URLS[1],
      maxRequestsPerSecond: env.MAX_REQUESTS_PER_SECOND,
      pollingInterval: env.POLLING_INTERVAL,
    },
  },
  contracts: {
    GnosisGNO: {
      abi: GnosisChainGno,
      chain: "gnosis_chain",
      // https://gnosisscan.io/address/0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb
      address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      startBlock: 11629829,
    },
    GnosisLGNO: {
      abi: GnosisChainLGno,
      chain: "gnosis_chain",
      // https://gnosisscan.io/address/0xd4Ca39f78Bf14BfaB75226AC833b1858dB16f9a1
      address: "0xd4Ca39f78Bf14BfaB75226AC833b1858dB16f9a1",
      startBlock: 20388099,
    },
    GnosisSGNO: {
      abi: GnosisChainSGno,
      chain: "gnosis_chain",
      // https://gnosisscan.io/address/0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445
      address: "0xA4eF9Da5BA71Cc0D2e5E877a910A37eC43420445",
      startBlock: 21275850,
    },
    MainnetGNO: {
      abi: MainnetGno,
      chain: "ethereum_mainnet",
      // https://etherscan.io/address/0x6810e776880C02933D47DB1b9fc05908e5386b96
      address: "0x6810e776880C02933D47DB1b9fc05908e5386b96",
      startBlock: 3557596,
    },
    MainnetLGNO: {
      abi: MainnetLGno,
      chain: "ethereum_mainnet",
      // https://etherscan.io/address/0x6810e776880C02933D47DB1b9fc05908e5386b96
      address: "0x4f8AD938eBA0CD19155a835f617317a6E788c868",
      startBlock: 14111111,
    },
  },
});
