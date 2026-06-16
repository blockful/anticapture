import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3100),
  HOST: z.string().default("0.0.0.0"),
  ANTICAPTURE_API_URL: z.string().default("http://localhost:4001"),
  ANTICAPTURE_API_KEY: z.string().optional(),
  // Preserve current semantics: only the literal "true" enables forwarding.
  FORWARD_CLIENT_AUTH: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
