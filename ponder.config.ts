import { createConfig } from "@ponder/core";
import { http } from "viem";

import { UnverifiedContractAbi } from "./abis/UnverifiedContractAbi";

export default createConfig({
  networks: {
    mainnet: { chainId: 1, transport: http(process.env.PONDER_RPC_URL_1) },
  },
  contracts: {
    UnverifiedContract: {
      abi: UnverifiedContractAbi,
      address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      network: "mainnet",
    },
  },
});
