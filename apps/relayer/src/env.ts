import dotenv from "dotenv";
import { getAddress, isAddress, isHex } from "viem";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  REDIS_URL: z.url(),

  DAO_NAME: z.string().min(1),

  RPC_URL: z.url(),
  CHAIN_ID: z.coerce.number().int(),

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

  MAX_RELAY_PER_ADDRESS_PER_DAY: z.coerce.number().int().optional().default(3),

  PORT: z.coerce.number().default(3002),
});

export const env = envSchema.parse(process.env);
