import { z } from "zod";

const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // Request timeout in milliseconds
  REQUEST_TIMEOUT: z.coerce.number().default(30000),

  // CORS
  CORS_ORIGIN: z.string().default("*"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      throw new Error(`Environment validation failed:\n${issues.join("\n")}`);
    }
    throw error;
  }
}

export const env = validateEnv();

// Dynamically extract all DAO_API_* environment variables
const apiUrlSchema = z.string().url().startsWith("http");

export const apiUrls: string[] = Object.keys(process.env)
  .filter((key) => key.startsWith("DAO_API_"))
  .sort() // Sort to ensure consistent ordering
  .map((key) => {
    const value = process.env[key];
    const result = apiUrlSchema.safeParse(value);

    if (!result.success) {
      throw new Error(
        `Invalid URL for ${key}: ${value}. Must be a valid HTTP/HTTPS URL. Error: ${result.error.issues[0]?.message}`
      );
    }

    return result.data;
  });

// Validate that at least one DAO_API_* URL is provided
if (apiUrls.length === 0) {
  throw new Error(
    "At least one DAO_API_* environment variable must be provided (e.g., DAO_API_UNISWAP=https://...)"
  );
}
