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
} else if (process.env.STATUS === "staging") {
  ({ networks, contracts } = config["staging"]);
} else if (process.env.STATUS === "test") {
  ({ networks, contracts } = config["test"]);
} else {
  throw new Error("No ENV variable STATUS");
}

const databaseConfig = process.env.DATABASE_URL
  ? {
      database: {
        kind: "postgres" as "postgres",
        connectionString: process.env.DATABASE_URL,
      },
    }
  : {};

export default createConfig({
  networks: {
    mainnet: {
      chainId: networks.chainId,
      transport:
        networks.rpcUrls.length > 1
          ? loadBalance(networks.rpcUrls.map((url) => http(url)))
          : http(networks.rpcUrls[0]),
    },
    anvil: {
      chainId: 31337,
      transport: http("http://127.0.0.1:8545"),
      disableCache: true,
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
  ...databaseConfig,
});
