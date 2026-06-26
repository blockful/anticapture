import dotenv from "dotenv";
import { z } from "zod";

import { isRailwayPreviewEnv } from "@/ci";

dotenv.config();

const CI = isRailwayPreviewEnv();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(4002),
    DATABASE_URL: z.string(),
    // Guards human-facing token management endpoints (mint/list/revoke).
    ADMIN_API_KEY: z.string().min(16),
    // Guards service-facing endpoints (/validate), shared with Gateful.
    INTERNAL_API_KEY: z.string().min(16),
    // CI/preview only: a fixed, known token seeded into the DB on boot so every
    // service in the same Railway PR preview shares a working API key. Required
    // in preview environments; ignored on dev/production. The seeded token's
    // tenant/name/rate-limit are fixed constants (see index.ts) — not worth env
    // vars, since the value only matters to ephemeral previews.
    SEED_TOKEN_PLAINTEXT: z.string().min(16).optional(),
  })
  .superRefine((data, ctx) => {
    if (CI && !data.SEED_TOKEN_PLAINTEXT) {
      ctx.addIssue({
        code: "custom",
        path: ["SEED_TOKEN_PLAINTEXT"],
        message: "SEED_TOKEN_PLAINTEXT is required in CI/preview environments",
      });
    }
  });

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;

/** True on Railway PR previews — gates the boot-time token seeding. */
export const isPreview = CI;
