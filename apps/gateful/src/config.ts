import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4001),
  ADDRESS_ENRICHMENT_API_URL: z.url().optional(),
  BLOCKFUL_API_TOKEN: z.string().optional(),
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce.number().default(300_000),
  CIRCUIT_BREAKER_MAX_COOLDOWN_MS: z.coerce.number().default(2_400_000),
  REDIS_URL: z.string().optional(),
});

function loadDaoMap(
  prefix: string,
  source: Record<string, string | undefined> = process.env,
): Map<string, string> {
  const result = new Map<string, string>();
  const urlSchema = z.url();

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith(prefix) && value) {
      const parsed = urlSchema.safeParse(value);
      if (!parsed.success) {
        throw new Error(`Invalid URL for ${key}: ${parsed.error.message}`);
      }
      const daoName = key.replace(prefix, "").toLowerCase();
      result.set(daoName, parsed.data);
    }
  }

  return result;
}

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  addressEnrichmentUrl: env.ADDRESS_ENRICHMENT_API_URL,
  blockfulApiToken: env.BLOCKFUL_API_TOKEN,
  redisUrl: env.REDIS_URL,
  daoApis: loadDaoMap("DAO_API_"),
  daoRelayers: loadDaoMap("DAO_RELAYER_"),
  circuitBreaker: {
    failureThreshold: env.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
    cooldownMs: env.CIRCUIT_BREAKER_COOLDOWN_MS,
    maxCooldownMs: env.CIRCUIT_BREAKER_MAX_COOLDOWN_MS,
  },
};
