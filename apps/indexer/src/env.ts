import { z } from "zod";
import dotenv from "dotenv";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";

dotenv.config();

const envSchema = z.object({
  RPC_URL: z.string(),
  DATABASE_URL: z
    .string()
    .optional()
    .default("postgres://postgres:postgres@localhost:5432/postgres"),
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
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
