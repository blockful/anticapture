import { createConfig, loadBalance } from "ponder";
import { http, Transport, webSocket } from "viem";
import dotenv from "dotenv";
import { config } from "./config";
dotenv.config();

let networks;
let contracts;

if (!process.env.STATUS) {
  throw new Error("Env variable STATUS is not defined");
} else if (
  process.env.STATUS === "production" ||
  process.env.STATUS === "nodeful"
) {
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
  >
);

// Create a Ponder configuration with specific contract ABIs
export default createConfig({
  networks: networkConfigs,
  contracts,
  ...databaseConfig,
});

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
