import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  ADDRESS_ENRICHMENT_API_URL: z.url().optional(),
  BLOCKFUL_API_TOKEN: z.string().optional(),
});

function loadDaoApis(
  source: Record<string, string | undefined> = process.env,
): Map<string, string> {
  const daoApis = new Map<string, string>();
  const urlSchema = z.url();

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("DAO_API_") && value) {
      const parsed = urlSchema.safeParse(value);
      if (!parsed.success) {
        throw new Error(`Invalid URL for ${key}: ${parsed.error.message}`);
      }
      const daoName = key.replace("DAO_API_", "").toLowerCase();
      daoApis.set(daoName, parsed.data);
    }
  }

  return daoApis;
}

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  addressEnrichmentUrl: env.ADDRESS_ENRICHMENT_API_URL,
  blockfulApiToken: env.BLOCKFUL_API_TOKEN,
  daoApis: loadDaoApis(),
};
