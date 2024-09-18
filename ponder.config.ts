import { createConfig, loadBalance } from "@ponder/core";
import { http } from "viem";
import { ENSTokenAbi } from "./abis/ENSTokenAbi";
import { ENSGovernorAbi } from "./abis/ENSGovernorAbi";
import dotenv from "dotenv";
import { config } from "./config";
dotenv.config();

let networks, contracts;
if (!process.env.STATUS) {
  throw new Error("Env variable STATUS is not defined");
} else if (process.env.STATUS === "production") {
  ({ networks, contracts } = config["production"]);
} else {
  ({ networks, contracts } = config["staging"]);
}

export default createConfig({
  networks: {
    mainnet: {
      chainId: networks.chainId,
      transport: loadBalance([http(networks.rpcUrl1), http(networks.rpcUrl2)]),
    },
  },

  contracts: {
    ENSToken: {
      abi: ENSTokenAbi,
      address: contracts.ENSToken.address as `0x${string}`,
      network: networks.name as any,
      startBlock: contracts.ENSToken.startBlock,
    },
    ENSGovernor: {
      abi: ENSGovernorAbi,
      address: contracts.ENSGovernor.address as `0x${string}`,
      network: networks.name as any,
      startBlock: contracts.ENSGovernor.startBlock,
    },
  },
});
