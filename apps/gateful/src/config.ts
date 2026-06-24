import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(4001),
    ADDRESS_ENRICHMENT_API_URL: z.url().optional(),
    // Per-tenant token auth via Authful.
    // Trim trailing slashes so a value like `https://authful/` does not produce
    // `//validate` downstream, which Hono serves as a 404 — making Authful look
    // unavailable for every uncached validation.
    TOKEN_SERVICE_URL: z
      .url()
      .transform((url) => url.replace(/\/+$/, ""))
      .optional(),
    TOKEN_SERVICE_API_KEY: z.string().optional(),
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
    CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce.number().default(300_000),
    CIRCUIT_BREAKER_MAX_COOLDOWN_MS: z.coerce.number().default(2_400_000),
    REDIS_URL: z.string().optional(),
    RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
  })
  .refine((env) => !env.TOKEN_SERVICE_URL || !!env.TOKEN_SERVICE_API_KEY, {
    message: "TOKEN_SERVICE_API_KEY is required when TOKEN_SERVICE_URL is set",
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
  tokenService: env.TOKEN_SERVICE_URL
    ? { url: env.TOKEN_SERVICE_URL, apiKey: env.TOKEN_SERVICE_API_KEY! }
    : undefined,
  redisUrl: env.REDIS_URL,
  commitSha: env.RAILWAY_GIT_COMMIT_SHA,
  daoApis: loadDaoMap("DAO_API_"),
  daoRelayers: loadDaoMap("DAO_RELAYER_"),
  circuitBreaker: {
    failureThreshold: env.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
    cooldownMs: env.CIRCUIT_BREAKER_COOLDOWN_MS,
    maxCooldownMs: env.CIRCUIT_BREAKER_MAX_COOLDOWN_MS,
  },
};
