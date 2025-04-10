import { createConfig, loadBalance } from "ponder";
import { http, Transport, webSocket } from "viem";
import dotenv from "dotenv";
import { config } from "./config";
import { NetworkEnum } from "@/lib/enums";
dotenv.config();

if (!process.env.STATUS) throw new Error("Env variable STATUS is not defined");
const { networks, contracts } =
  config[process.env.STATUS as "production" | "staging" | "test"];
if (!networks || !contracts) throw new Error("No networks or contracts");

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
