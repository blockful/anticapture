import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  POLLING_INTERVAL_MS: z.coerce.number().default(60_000),
  FORCE_BACKFILL: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
  PROVIDER_ENDPOINT: z
    .string()
    .default("https://hub.snapshot.org/graphql"),
  PROVIDER_API_KEY: z.string().optional(),
  PROVIDER_DAO_ID: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error("Invalid environment variables: " + _env.error.message);
}

export const env = _env.data;
