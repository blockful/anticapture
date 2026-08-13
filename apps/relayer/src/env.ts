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

  // Proposal lifecycle keeper — pays gas to queue()/execute() succeeded
  // proposals. Off by default; KEEPER_START_BLOCK is required when enabled.
  KEEPER_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  KEEPER_START_BLOCK: z.coerce.bigint().nonnegative().optional(),
  KEEPER_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().default(300),
  KEEPER_QUEUE_DELAY_SECONDS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(1800),
  KEEPER_EXECUTION_DELAY_SECONDS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(1800),
  // Widest fromBlock..toBlock span per log scan; RPC providers cap this.
  KEEPER_MAX_BLOCK_RANGE: z.coerce.bigint().positive().default(10_000n),

  PORT: z.coerce.number().default(3002),

  // Injected by Railway. Reported on /health so gateful — which merges this
  // service's OpenAPI paths and schemas into its own spec — can tell which
  // release is answering. See scripts/wait-for-gateful.mjs.
  RAILWAY_GIT_COMMIT_SHA: z.string().optional(),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
});

export const env = envSchema
  .refine((e) => !e.KEEPER_ENABLED || e.KEEPER_START_BLOCK !== undefined, {
    message: "KEEPER_START_BLOCK is required when KEEPER_ENABLED=true",
    path: ["KEEPER_START_BLOCK"],
  })
  .parse(process.env);
