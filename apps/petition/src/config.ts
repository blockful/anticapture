import { config } from "dotenv";
import { z } from "zod";

config();

export const baseConfig = {
  DATABASE_URL: z.string().optional().default("./test.db"),
  PORT: z.coerce.number().optional().default(5000),
  ANTICAPTURE_API_URL: z.string(),
  NODE_ENV: z.enum(["test", "production"]).optional().default("test"),
};

const testConfig = z.object({
  ...baseConfig,
  ANTICAPTURE_API_URL: z.string().default("http://localhost:4000"),
});

const prodConfig = z.object({
  ...baseConfig,
  ANTICAPTURE_API_URL: z.string(),
});

const configSchema =
  process.env.NODE_ENV === "test" ? testConfig : prodConfig;

export const env = configSchema.parse(process.env);