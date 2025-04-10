import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  RPC_URL: z.string(),
  STATUS: z.enum(["production", "staging"]),
  DATABASE_URL: z.string(),
  PONDER_RPC_URL: z.string(),
  POOLING_INTERVAL: z.number().default(1000),
  MAX_REQUESTS_PER_SECOND: z.number().default(50),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.format());

  throw new Error("Invalid environment variables");
}

export const env = _env.data;
