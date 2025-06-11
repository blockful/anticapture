import { z } from "zod";
import dotenv from "dotenv";

import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

dotenv.config();

const envSchema = z.object({
  RPC_URL: z.string(),
  DATABASE_URL: z.string(),
  POLLING_INTERVAL: z.coerce.number().default(10000), // 10s
  MAX_REQUESTS_PER_SECOND: z.coerce.number().default(20),
  NETWORK: z.nativeEnum(NetworkEnum),
  DAO_ID: z.nativeEnum(DaoIdEnum),
  CHAIN_ID: z.coerce.number(),
  DUNE_API_URL: z.string().optional(),
  DUNE_API_KEY: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  PORT: z.coerce.number().default(42069),
  API_URL: z.string().optional(),
});

const _env = envSchema.parse(process.env);

if (!_env.API_URL) {
  _env.API_URL = `http://127.0.0.1:${_env.PORT}`;
}

export const env = _env;
