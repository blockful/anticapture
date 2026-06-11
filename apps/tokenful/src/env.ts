import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4002),
  DATABASE_URL: z.string(),
  // Guards human-facing token management endpoints (mint/list/revoke).
  ADMIN_API_KEY: z.string().min(16),
  // Guards service-facing endpoints (/validate, /usage/batch), shared with Gateful.
  INTERNAL_API_KEY: z.string().min(16),
});

export const env = envSchema.parse(process.env);
