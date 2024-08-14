import { createConfig, loadBalance } from "@ponder/core";
import { http } from "viem";

import { ENSTokenAbi } from "./abis/ENSTokenAbi";
import { ENSGovernorAbi } from "./abis/ENSGovernorAbi";

if (!process.env.START_BLOCK) {
  throw new Error("START_BLOCK is not defined in the .env.local file");
}

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: loadBalance([
        http(process.env.PONDER_RPC_URL_1),
        http(process.env.PONDER_RPC_URL_1_2),
      ]),
    },
  },
  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      network: "mainnet",
      startBlock: parseInt(process.env.START_BLOCK),
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
      network: "mainnet",
      startBlock: parseInt(process.env.START_BLOCK),

    },
  },
});