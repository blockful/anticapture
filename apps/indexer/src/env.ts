import { z } from "zod";
import dotenv from "dotenv";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

dotenv.config();

const envSchema = z.object({
  RPC_URL: z.string(),
  DATABASE_URL: z.string(),
  POOLING_INTERVAL: z.number().default(1000),
  MAX_REQUESTS_PER_SECOND: z.number().default(50),
  NETWORK: z.nativeEnum(NetworkEnum),
  DAO_ID: z.nativeEnum(DaoIdEnum),
  CHAIN_ID: z.coerce.number(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
