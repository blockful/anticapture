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
  DUNE_API_URL: z.string(),
  DUNE_API_KEY: z.string(),
  COINGECKO_API_KEY: z.string(),
  REDIS_URL: z.string().optional(),
  PORT: z.coerce.number().default(42069),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}

if (_env.data.RAILWAY_PUBLIC_DOMAIN) {
  _env.data.RAILWAY_PUBLIC_DOMAIN = `https://${_env.data.RAILWAY_PUBLIC_DOMAIN}`;
} else {
  _env.data.RAILWAY_PUBLIC_DOMAIN = `http://localhost:${_env.data.PORT}`;
}

export const env = _env.data;
