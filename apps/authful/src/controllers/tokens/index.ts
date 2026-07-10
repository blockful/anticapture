import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  ErrorResponseSchema,
  MintTokenBodySchema,
  MintTokenResponseSchema,
  TokenListResponseSchema,
  TokenParamsSchema,
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
      tags: ["tokens"],
      responses: {
        200: {
          description: "All tokens, newest first",
          content: { "application/json": { schema: TokenListResponseSchema } },
        },
        403: forbiddenResponse,
      },
    }),
    async (c) => {
      // Listing exposes every tenant's metadata — admin only. The User API
      // tracks its own users' keys, so it never needs this.
      if (c.get("authScope") !== "admin") {
        return c.json({ error: "listing requires the admin scope" }, 403);
      }
      const tokens = await service.list();
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
