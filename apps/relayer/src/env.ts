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

  MIN_VOTING_POWER: z
    .string()
    .regex(/^\d+$/, "Must be a non-negative decimal")
    .default("0"),

  // 0.1 ETH default — below this the relayer reports hasEnoughBalance: false
  MIN_RELAYER_BALANCE_WEI: z
    .string()
    .regex(/^\d+$/, "Must be a non-negative decimal")
    .default("100000000000000000"),

  // Per address, per calendar month (UTC). Optional; each defaults to DEFAULT_RELAY_LIMIT (3).
  // .positive() rejects 0/negatives: a 0 limit would block all relays — omit the var to use the default instead.
  MAX_VOTES_PER_ADDRESS_PER_MONTH: z.coerce
    .number()
    .int()
    .positive()
    .optional(),
  MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  PORT: z.coerce.number().default(3002),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
});

export const env = envSchema.parse(process.env);
