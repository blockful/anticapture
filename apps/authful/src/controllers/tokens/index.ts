import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  ErrorResponseSchema,
  ListTokenUsageQuerySchema,
  ListTokensQuerySchema,
  MintTokenBodySchema,
  MintTokenResponseSchema,
  RecordTokenUsageBodySchema,
  TokenListResponseSchema,
  TokenParamsSchema,
  TokenUsageListResponseSchema,
  toTokenMetadata,
} from "@/mappers/tokens";
import { USER_TENANT_PREFIX } from "@/middlewares/token-auth";
import type { TokensService } from "@/services/tokens";

const forbiddenResponse = {
  description: "Scope not permitted for this operation",
  content: { "application/json": { schema: ErrorResponseSchema } },
};

export function tokensController(app: Hono, service: TokensService) {
  app.openapi(
    createRoute({
      method: "post",
      operationId: "recordTokenUsage",
      path: "/tokens/usage",
      summary: "Increment daily request usage for tokens",
      tags: ["tokens"],
      request: {
        body: {
          required: true,
          content: {
            "application/json": { schema: RecordTokenUsageBodySchema },
          },
        },
      },
      responses: {
        204: { description: "Usage recorded; unknown token ids are ignored" },
      },
    }),
    async (c) => {
      const { idempotencyKey, items } = c.req.valid("json");
      // Both non-admin scopes (provisioning and usage) may only touch
      // end-user tokens — Gateful only accumulates `user:*` tenants anyway.
      await service.recordUsage(idempotencyKey, items, {
        requireTenantPrefix:
          c.get("authScope") === "admin" ? undefined : USER_TENANT_PREFIX,
      });
      return c.body(null, 204);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "listTokenUsage",
      path: "/tokens/usage",
      summary: "List the last 30 days of token usage for one tenant",
      tags: ["tokens"],
      request: { query: ListTokenUsageQuerySchema },
      responses: {
        200: {
          description: "Daily usage rows for the tenant's tokens",
          content: {
            "application/json": { schema: TokenUsageListResponseSchema },
          },
        },
        403: forbiddenResponse,
      },
    }),
    async (c) => {
      const { tenant } = c.req.valid("query");
      if (
        c.get("authScope") !== "admin" &&
        !tenant.startsWith(USER_TENANT_PREFIX)
      ) {
        return c.json(
          {
            error: `provisioning scope may only list a single ${USER_TENANT_PREFIX}* tenant`,
          },
          403,
        );
      }
      return c.json({ items: await service.usageByTenant(tenant) }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      operationId: "mintToken",
      path: "/tokens",
      summary: "Mint a token for a tenant",
      description:
        "Returns the plaintext token exactly once; only its sha256 hash is stored.",
      tags: ["tokens"],
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: MintTokenBodySchema } },
        },
      },
      responses: {
        201: {
          description: "The minted token, including its one-time plaintext",
          content: {
            "application/json": { schema: MintTokenResponseSchema },
          },
        },
        403: forbiddenResponse,
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      // The provisioning key may only mint end-user keys.
      if (
        c.get("authScope") === "provisioning" &&
        !body.tenant.startsWith(USER_TENANT_PREFIX)
      ) {
        return c.json(
          {
            error: `provisioning scope may only mint ${USER_TENANT_PREFIX}* tenants`,
          },
          403,
        );
      }
      const { token, plaintext } = await service.mint(body);
      return c.json({ ...toTokenMetadata(token), token: plaintext }, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "listTokens",
      path: "/tokens",
      summary: "List token metadata (never hashes or plaintext)",
      description:
        "Admin lists all tenants (optionally filtered by ?tenant). The " +
        "provisioning scope may list only a single user:* tenant it owns.",
      tags: ["tokens"],
      request: { query: ListTokensQuerySchema },
      responses: {
        200: {
          description: "Matching tokens, newest first",
          content: { "application/json": { schema: TokenListResponseSchema } },
        },
        403: forbiddenResponse,
      },
    }),
    async (c) => {
      const { tenant } = c.req.valid("query");
      // Unfiltered listing exposes every tenant's metadata — admin only. The
      // provisioning key may list, but only its own user:* tenant (so the User
      // API can read its users' keys, e.g. lastUsedAt).
      if (
        c.get("authScope") !== "admin" &&
        (!tenant || !tenant.startsWith(USER_TENANT_PREFIX))
      ) {
        return c.json(
          {
            error: `provisioning scope may only list a single ${USER_TENANT_PREFIX}* tenant`,
          },
          403,
        );
      }
      // Provisioning callers use this purely for usage enrichment of the
      // (quota-capped) active keys — revoked history would grow unbounded
      // under key churn. Admin keeps the full history view.
      const tokens = await service.list(tenant, {
        activeOnly: c.get("authScope") === "provisioning",
      });
      return c.json({ items: tokens.map(toTokenMetadata) }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      operationId: "revokeToken",
      path: "/tokens/{id}",
      summary: "Revoke a token",
      description: "Idempotent — revoking an already-revoked token is a no-op.",
      tags: ["tokens"],
      request: { params: TokenParamsSchema },
      responses: {
        204: { description: "Token revoked" },
        404: {
          description: "Token not found",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      // Provisioning scope can only revoke `user:*` tokens; a non-matching id
      // returns 404 (same as missing) to avoid a first-party-token oracle.
      const requireTenantPrefix =
        c.get("authScope") === "provisioning" ? USER_TENANT_PREFIX : undefined;
      const revoked = await service.revoke(id, { requireTenantPrefix });
      if (!revoked) return c.json({ error: "Token not found" }, 404);
      return c.body(null, 204);
    },
  );
}
