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

    // Allowed frontend hosts (main dashboard, localhost for local dev, every
    // whitelabel host). Single source of truth per host: the SIWE domain a
    // signed message must match, the better-auth baseURL (cookie/CSRF scope,
    // derived as https://<host> — http for localhost), and the trusted-origin
    // allowlist. There is deliberately no single BETTER_AUTH_URL: the service
    // serves many origins and each request is scoped to its own.
    AUTH_SIWE_DOMAINS: csv().refine((a) => a.length > 0, {
      message: "AUTH_SIWE_DOMAINS must list at least one host",
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

    // User self-service API keys: enabled when both are set. The User API
    // brokers keys into Authful over the private network using a provisioning
    // key scoped to `user:*` tenants.
    AUTHFUL_URL: z.string().url().optional(),
    AUTHFUL_PROVISIONING_API_KEY: z.string().min(16).optional(),
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
    if (
      Boolean(data.AUTHFUL_URL) !== Boolean(data.AUTHFUL_PROVISIONING_API_KEY)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTHFUL_PROVISIONING_API_KEY"],
        message:
          "AUTHFUL_URL and AUTHFUL_PROVISIONING_API_KEY must be set together",
      });
    }
  });

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables", _env.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
