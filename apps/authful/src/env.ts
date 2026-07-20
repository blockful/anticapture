import dotenv from "dotenv";
import { z } from "zod";

import { isRailwayPreviewEnv } from "@/ci";

dotenv.config();

const CI = isRailwayPreviewEnv();

// A secret that may be absent: accepts a real value, and treats unset OR
// empty-string (a blank var defined in some environments) as undefined.
// zod v4 note: `z.preprocess(fn, schema.optional())` REJECTS a truly unset
// var ("expected nonoptional" — the inner optional doesn't make the pipe's
// input optional), which crashed boots in environments without the var.
const optionalSecret = z
  .string()
  .min(16)
  .optional()
  .or(z.literal("").transform(() => undefined));

const envSchema = z
  .object({
    PORT: z.coerce.number().default(4002),
    DATABASE_URL: z.string(),
    // Guards human-facing token management endpoints (mint/list/revoke).
    ADMIN_API_KEY: z.string().min(16),
    // Guards service-facing endpoints (/validate), shared with Gateful.
    INTERNAL_API_KEY: z.string().min(16),
    // Optional scoped key for the User API to broker end-user keys: restricted
    // to `user:*` tenants (mint/revoke only, no listing). Absent until the
    // environment enables the User API's key provisioning.
    PROVISIONING_API_KEY: optionalSecret,
    // CI/preview only: a fixed, known token seeded into the DB on boot so every
    // service in the same Railway PR preview shares a working API key. Required
    // in preview environments; ignored on dev/production. The seeded token's
    // tenant/name/rate-limit are fixed constants (see index.ts) — not worth env
    // vars, since the value only matters to ephemeral previews.
    SEED_TOKEN_PLAINTEXT: optionalSecret,
  })
  .superRefine((data, ctx) => {
    if (CI && !data.SEED_TOKEN_PLAINTEXT) {
      ctx.addIssue({
        code: "custom",
        path: ["SEED_TOKEN_PLAINTEXT"],
        message: "SEED_TOKEN_PLAINTEXT is required in CI/preview environments",
      });
    }
    // The provisioning key is a security boundary: scopedTokenAuth matches
    // the admin key first, so a provisioning key configured to the same
    // value would classify every User API call as admin and silently void
    // the user:* tenant restriction. Refuse to boot in that state.
    if (
      data.PROVISIONING_API_KEY &&
      (data.PROVISIONING_API_KEY === data.ADMIN_API_KEY ||
        data.PROVISIONING_API_KEY === data.INTERNAL_API_KEY)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["PROVISIONING_API_KEY"],
        message:
          "PROVISIONING_API_KEY must differ from ADMIN_API_KEY and INTERNAL_API_KEY",
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
