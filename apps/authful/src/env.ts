import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4002),
  DATABASE_URL: z.string(),
  // Guards human-facing token management endpoints (mint/list/revoke).
  ADMIN_API_KEY: z.string().min(16),
  // Guards service-facing endpoints (/validate), shared with Gateful.
  INTERNAL_API_KEY: z.string().min(16),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
