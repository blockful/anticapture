import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { ValidateBodySchema, ValidateResponseSchema } from "@/mappers/tokens";
import type { TokensService } from "@/services/tokens";

export function validateController(app: Hono, service: TokensService) {
  app.openapi(
    createRoute({
      method: "post",
      operationId: "validateToken",
      path: "/validate",
      summary: "Validate a token hash (internal, called by Gateful)",
      description:
        "Receives the sha256 of a bearer token, never the plaintext. Touches last_used_at on success.",
      tags: ["internal"],
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: ValidateBodySchema } },
        },
      },
      responses: {
        200: {
          description: "Valid token with tenant metadata",
          content: { "application/json": { schema: ValidateResponseSchema } },
        },
        400: {
          description: "Token validation failed",
          content: { "application/json": { schema: ValidateResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { tokenHash } = c.req.valid("json");
      const result = await service.validate(tokenHash);
      if (!result.valid) return c.json(result, 400);
      return c.json(result, 200);
    },
  );
}
