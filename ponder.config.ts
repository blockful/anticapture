import { createConfig, loadBalance } from "@ponder/core";
import { http } from "viem";
import { ENSTokenAbi } from "./abis/ENSTokenAbi";
import { ENSGovernorAbi } from "./abis/ENSGovernorAbi";
import configData from "./config.json";
import dotenv from "dotenv";

dotenv.config();

let networks, contracts;
if (!process.env.STATUS) {
  throw new Error("Env variable STATUS is not defined");
} else if (process.env.STATUS === "production") {
  ({ networks, contracts } = configData["production"]);
} else {
  ({ networks, contracts } = configData["staging"]);
}

export default createConfig({
  networks: {
    mainnet: {
      chainId: networks.chainId,
      transport: loadBalance([
        http(process.env.PONDER_RPC_URL_1),
        http(process.env.PONDER_RPC_URL_1_2),
      ]),
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
      network: "mainnet",
      startBlock: contracts.ENSGovernor.startBlock,
    },
  },
});
