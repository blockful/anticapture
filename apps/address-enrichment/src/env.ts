import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ARKHAM_API_KEY: z.string().min(1, "ARKHAM_API_KEY is required"),
  ARKHAM_API_URL: z
    .string()
    .url()
    .default("https://api.arkhamintelligence.com"),
  RPC_URL: z.string().url("RPC_URL must be a valid URL"),
  ANTICAPTURE_API_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(3001),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
