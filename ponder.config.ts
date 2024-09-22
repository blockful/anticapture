import { createConfig, loadBalance } from "@ponder/core";
import { http } from "viem";
import { ENSTokenAbi, ENSGovernorAbi } from "./src/ens/abi";
import { UNITokenAbi } from "./src/uni/abi";
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

({ networks, contracts } = config["production"]);

export default createConfig({
  networks: {
    mainnet: {
      chainId: networks.chainId,
      transport: loadBalance([http(networks.rpcUrl1)]),
      maxRequestsPerSecond: 10000,
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
    UNIToken: {
      abi: UNITokenAbi,
      address: contracts.UNIToken.address as `0x${string}`,
      network: networks.name as any,
      startBlock: contracts.UNIToken.startBlock,
    },
  },
});
