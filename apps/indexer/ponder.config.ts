import { createConfig } from "ponder";
import { Transport } from "viem";
import { config } from "./config";
import { NetworkEnum } from "@/lib/enums";
import { env } from "./confg";


const { networks, contracts } = config[env.STATUS];

if (!networks || !contracts) throw new Error("No networks or contracts");

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env.DATABASE_URL,
  },
  networks: networks as Record<
    NetworkEnum,
    { chainId: number; transport: Transport; maxRequestsPerSecond: number }
  >,
  contracts,
});

//@ts-ignore
//This line is to avoid the error "Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};
