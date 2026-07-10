import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const csv = () =>
  z.string().transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const envSchema = z
  .object({
    PORT: z.coerce.number().default(4003),
    DATABASE_URL: z.string(),

    // Better-auth session signing key. Own root of trust for every session
    // this service issues — must be >= 32 high-entropy chars.
    BETTER_AUTH_SECRET: z.string().min(32),
    // Browser-visible base URL of this service (through the dashboard's
    // /api/user proxy). Better-auth pins cookies and callbacks to it.
    BETTER_AUTH_URL: z.string().url(),

    // Hosts a SIWE message may be bound to. One better-auth instance is built
    // per entry so whitelabel domains can sign in against their real host
    // (the SIWE plugin validates a single domain per instance). First entry is
    // the fallback for unknown hosts.
    AUTH_SIWE_DOMAINS: csv().refine((a) => a.length > 0, {
      message: "AUTH_SIWE_DOMAINS must list at least one host",
    }),
    // Origins allowed to call the auth endpoints (CSRF allowlist). Include the
    // main dashboard and every whitelabel origin.
    TRUSTED_ORIGINS: csv().refine((a) => a.length > 0, {
      message: "TRUSTED_ORIGINS must list at least one origin",
    }),

    // RPC endpoint used to verify EIP-1271 / smart-contract-wallet signatures.
    RPC_URL: z.string().url(),

    // Optional auth methods — each stays disabled until its config is present,
    // so the service boots SIWE-only out of the box.
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // Magic link: enabled when RESEND_API_KEY is set. RESEND_FROM_EMAIL
    // defaults to Resend's sandbox sender for local/dev.
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().default("onboarding@resend.dev"),
  })
  .superRefine((data, ctx) => {
    if (Boolean(data.GOOGLE_CLIENT_ID) !== Boolean(data.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["GOOGLE_CLIENT_SECRET"],
        message:
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
      });
    }
  });

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
