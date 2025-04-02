import { createConfig, loadBalance } from "ponder";
import { Address, http, Transport, webSocket } from "viem";
import dotenv from "dotenv";
import { config, Network, contractAbis } from "./config";
import { NetworkEnum } from "@/lib/enums";
dotenv.config();

let networks: Partial<Record<NetworkEnum, Network>>;
if (!process.env.STATUS) {
  throw new Error("Env variable STATUS is not defined");
} else if (
  process.env.STATUS === "production" ||
  process.env.STATUS === "nodeful"
) {
  ({ networks } = config["production"]);
} else if (process.env.STATUS === "staging") {
  ({ networks } = config["staging"]);
} else if (process.env.STATUS === "test") {
  ({ networks } = config["test"]);
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

const networkConfigs = Object.entries(networks).reduce(
  (acc, [network, { chainId, rpcUrls }]) => ({
    ...acc,
    [network]: {
      chainId,
      transport:
        rpcUrls.length > 1
          ? loadBalance(rpcUrls.map((url) => http(url)))
          : webSocket(rpcUrls[0]),
      maxRequestsPerSecond:
        process.env.STATUS !== "production" && process.env.STATUS !== "staging"
          ? 10000
          : 1000,
    },
  }),
  {} as Record<
    string,
    { chainId: number; transport: Transport; maxRequestsPerSecond: number }
  >,
);

// Create a Ponder configuration with specific contract ABIs
export default createConfig({
  networks: networkConfigs,
  contracts: {
    ENSToken: {
      abi: contractAbis.ENSToken,
      network: networks.mainnet?.name || "mainnet",
      address: networks.mainnet?.contracts.ENSToken?.address || "0x0",
      startBlock: networks.mainnet?.contracts.ENSToken?.startBlock || 0,
    },
    ENSGovernor: {
      abi: contractAbis.ENSGovernor,
      network: networks.mainnet?.name || "mainnet",
      address: networks.mainnet?.contracts.ENSGovernor?.address || "0x0",
      startBlock: networks.mainnet?.contracts.ENSGovernor?.startBlock || 0,
    },
    UNIToken: {
      abi: contractAbis.UNIToken,
      network: networks.mainnet?.name || "mainnet",
      address: networks.mainnet?.contracts.UNIToken?.address || "0x0",
      startBlock: networks.mainnet?.contracts.UNIToken?.startBlock || 0,
    },
    UNIGovernor: {
      abi: contractAbis.UNIGovernor,
      network: networks.mainnet?.name || "mainnet",
      address: networks.mainnet?.contracts.UNIGovernor?.address || "0x0",
      startBlock: networks.mainnet?.contracts.UNIGovernor?.startBlock || 0,
    },
    ARBToken: {
      abi: contractAbis.ARBToken,
      network: networks.arbitrum?.name || "arbitrum",
      address: networks.arbitrum?.contracts.ARBToken?.address || "0x0",
      startBlock: networks.arbitrum?.contracts.ARBToken?.startBlock || 0,
    },
  },
  ...databaseConfig,
});

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
