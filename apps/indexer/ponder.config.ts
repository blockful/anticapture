import { createConfig, loadBalance } from "ponder";
import { http, Transport, webSocket } from "viem";
import dotenv from "dotenv";
import { config } from "./config";
import { NetworkEnum } from "@/lib/enums";
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

// Create a Ponder configuration with specific contract ABIs
export default createConfig({
  networks: networks as Record<
    NetworkEnum,
    { chainId: number; transport: Transport; maxRequestsPerSecond: number }
  >,
  contracts,
  ...databaseConfig,
});

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
