import { createConfig, loadBalance } from "ponder";
import { Abi, Address, http, Transport, webSocket } from "viem";
import dotenv from "dotenv";
import { config, PonderContract, Network } from "./config";
import { anvil } from "viem/chains";
dotenv.config();

let networks: Record<string, Network>;
if (!process.env.STATUS) {
  throw new Error("Env variable STATUS is not defined");
} else if (
  process.env.STATUS === "production" ||
  process.env.STATUS === "nodeful"
) {
  ({ networks } = config.ponder["production"]);
} else if (process.env.STATUS === "staging") {
  ({ networks } = config.ponder["staging"]);
} else if (process.env.STATUS === "test") {
  ({ networks } = config.ponder["test"]);
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

export default createConfig({
  networks: networkConfigs,
  contracts: {
    ...Object.values(networks).reduce(
      (acc, network) => ({
        ...acc,
        ...Object.entries(network.contracts).reduce(
          (acc, [contractName, contract]) => ({
            ...acc,
            [contractName]: {
              abi: contract.abi,
              address: contract.address,
              network: network.name,
              startBlock: contract.startBlock,
            },
          }),
          {} as Record<
            string,
            { abi: Abi; address: Address; network: string; startBlock: number }
          >,
        ),
      }),
      {} as Record<
        string,
        { abi: Abi; address: Address; network: string; startBlock: number }
      >,
    ),
  },
  ...databaseConfig,
});

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
