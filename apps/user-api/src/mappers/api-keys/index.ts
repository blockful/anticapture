import { z } from "@hono/zod-openapi";

export const ApiKeySchema = z
  .object({
    id: z.string(),
    label: z.string(),
    createdAt: z.string(),
    revokedAt: z.string().nullable(),
    // Sourced from Authful; null when never used or Authful was unreachable.
    lastUsedAt: z.string().nullable(),
  })
  .openapi("ApiKey");

export const ApiKeyListResponseSchema = z
  .object({ items: z.array(ApiKeySchema) })
  .openapi("ApiKeyListResponse");

export const ApiKeyUsageSchema = z
  .object({
    keyId: z.uuid(),
    label: z.string(),
    day: z.iso.date(),
    count: z.number().int().nonnegative(),
  })
  .openapi("ApiKeyUsage");

export const ApiKeyUsageListResponseSchema = z
  .object({ items: z.array(ApiKeyUsageSchema) })
  .openapi("ApiKeyUsageListResponse");

export const CreateApiKeyBodySchema = z
  .object({ label: z.string().min(1).max(100) })
  .openapi("CreateApiKeyBody");

// The plaintext is included exactly once, on creation only.
export const CreatedApiKeyResponseSchema = ApiKeySchema.extend({
  token: z
    .string()
    .describe(
      "Plaintext API key — shown exactly once, never retrievable again",
    ),
}).openapi("CreatedApiKey");

export const ApiKeyParamsSchema = z
  .object({ id: z.uuid() })
  .openapi("ApiKeyParams");
