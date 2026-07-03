import { z } from "@hono/zod-openapi";

export const TokenMetadataSchema = z
  .object({
    id: z.uuid(),
    tenant: z.string(),
    name: z.string(),
    rateLimitPerMin: z.number().int(),
    createdAt: z.iso.datetime(),
    revokedAt: z.iso.datetime().nullable(),
    lastUsedAt: z.iso.datetime().nullable(),
  })
  .openapi("TokenMetadata");

export const TokenListResponseSchema = z
  .object({ items: z.array(TokenMetadataSchema) })
  .openapi("TokenListResponse");

export const MintTokenBodySchema = z
  .object({
    tenant: z.string().min(1),
    name: z.string().min(1),
    rateLimitPerMin: z.number().int().nonnegative().optional().openapi({
      description:
        "Requests per minute. 0 means unbounded (no rate limiting). Omit to default to 600.",
    }),
  })
  .openapi("MintTokenBody");

export const MintTokenResponseSchema = TokenMetadataSchema.extend({
  token: z
    .string()
    .describe("Plaintext token — shown exactly once, only the hash is stored"),
}).openapi("MintTokenResponse");

export const TokenParamsSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const ValidateBodySchema = z
  .object({ tokenHash: z.string().regex(/^[0-9a-f]{64}$/) })
  .openapi("ValidateBody");

export const ValidateResponseSchema = z
  .discriminatedUnion("valid", [
    z.object({ valid: z.literal(false) }),
    z.object({
      valid: z.literal(true),
      tokenId: z.uuid(),
      tenant: z.string(),
      rateLimitPerMin: z.number().int(),
    }),
  ])
  .openapi("ValidateResponse");

export const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi("ErrorResponse");

export function toTokenMetadata(token: {
  id: string;
  tenant: string;
  name: string;
  rateLimitPerMin: number;
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}) {
  return {
    id: token.id,
    tenant: token.tenant,
    name: token.name,
    rateLimitPerMin: token.rateLimitPerMin,
    createdAt: token.createdAt.toISOString(),
    revokedAt: token.revokedAt?.toISOString() ?? null,
    lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
  };
}
