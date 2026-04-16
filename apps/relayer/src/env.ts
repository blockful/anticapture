import dotenv from "dotenv";
import { getAddress, isAddress, isHex } from "viem";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  RPC_URL: z.string().url(),
  CHAIN_ID: z.coerce.number(),

  GOVERNOR_ADDRESS: z
    .string()
    .refine(isAddress, "Invalid Ethereum address")
    .transform((v) => getAddress(v)),
  TOKEN_ADDRESS: z
    .string()
    .refine(isAddress, "Invalid Ethereum address")
    .transform((v) => getAddress(v)),

  RELAYER_PRIVATE_KEY: z
    .string()
    .refine(isHex, "Invalid hex string")
    .transform((v) => v as `0x${string}`),

  MIN_VOTING_POWER: z.string().default("0"),

  MAX_RELAY_PER_ADDRESS_PER_DAY: z.coerce.number().default(50),
  MAX_RELAY_PER_ADDRESS_PER_HOUR: z.coerce.number().default(5),

  MIN_BALANCE_WEI: z.string().default("100000000000000000"),

  BLOCKFUL_API_TOKEN: z.string().optional(),

  PORT: z.coerce.number().default(4001),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
