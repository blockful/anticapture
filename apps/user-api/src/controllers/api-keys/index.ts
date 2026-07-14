import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";

import type { AuthResolver } from "@/auth";
import {
  ApiKeyListResponseSchema,
  ApiKeyParamsSchema,
  CreateApiKeyBodySchema,
  CreatedApiKeyResponseSchema,
} from "@/mappers/api-keys";
import { ErrorResponseSchema, unauthorizedResponses } from "@/mappers/errors";
import { sessionAuth } from "@/middlewares/session";
import type { ApiKeyRow } from "@/repositories/api-keys";
import {
  ApiKeyQuotaExceededError,
  type ApiKeysService,
} from "@/services/api-keys";

const toResponse = (row: ApiKeyRow, lastUsedAt: string | null = null) => ({
  id: row.id,
  label: row.label,
  createdAt: row.createdAt.toISOString(),
  revokedAt: row.revokedAt?.toISOString() ?? null,
  lastUsedAt,
});

export function apiKeysController(
  app: OpenAPIHono,
  service: ApiKeysService,
  resolver: AuthResolver,
) {
  const auth = sessionAuth(resolver);

  app.openapi(
    createRoute({
      method: "get",
      operationId: "listApiKeys",
      path: "/me/api-keys",
      summary: "List the session user's active API keys",
      middleware: [auth] as const,
      responses: {
        200: {
          description: "Active API keys, newest first",
          content: { "application/json": { schema: ApiKeyListResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("sessionUser");
      const keys = await service.list(userId);
      return c.json(
        ApiKeyListResponseSchema.parse({
          items: keys.map((k) => toResponse(k, k.lastUsedAt)),
        }),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      operationId: "createApiKey",
      path: "/me/api-keys",
      summary: "Create an API key",
      description:
        "Mints a key scoped to the session user via Authful. The plaintext is " +
        "returned exactly once and never stored here.",
      middleware: [auth] as const,
      request: {
        body: {
          // Without this a body-less POST skips JSON validation entirely and
          // surfaces as a 500 instead of the intended 400.
          required: true,
          content: { "application/json": { schema: CreateApiKeyBodySchema } },
        },
      },
      responses: {
        201: {
          description: "The created key, including its one-time plaintext",
          content: {
            "application/json": { schema: CreatedApiKeyResponseSchema },
          },
        },
        403: {
          description: "API key quota reached",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const { label } = c.req.valid("json");
      const { id: userId } = c.get("sessionUser");
      try {
        const { key, plaintext } = await service.create(userId, label);
        return c.json(
          CreatedApiKeyResponseSchema.parse({
            ...toResponse(key),
            token: plaintext,
          }),
          201,
        );
      } catch (err) {
        if (err instanceof ApiKeyQuotaExceededError) {
          return c.json({ error: "api_key_limit_reached" }, 403);
        }
        throw err;
      }
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      operationId: "revokeApiKey",
      path: "/me/api-keys/{id}",
      summary: "Revoke an API key",
      description:
        "Only the owner can revoke. Ownership comes from the session.",
      middleware: [auth] as const,
      request: { params: ApiKeyParamsSchema },
      responses: {
        204: { description: "Key revoked" },
        404: {
          description: "Key not found",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { id: userId } = c.get("sessionUser");
      const revoked = await service.revoke(id, userId);
      if (!revoked) return c.json({ error: "api_key_not_found" }, 404);
      return c.body(null, 204);
    },
  );
}
