import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaoTokensResponseSchema, type DaoTokenItem } from "@/mappers";
import { setCacheControl } from "@/middlewares";

export interface DaoTokensClient {
  getAvailableTokens(): Promise<DaoTokenItem[]>;
}

export function availableTokens(app: Hono, service: DaoTokensClient) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "availableTokens",
      path: "/tokens/available",
      summary: "Get available tokens",
      description:
        "Get available ERC-20 tokens for transfer in the DAO's governance chain",
      tags: ["tokens"],
      middleware: [setCacheControl(300)],
      responses: {
        200: {
          description: "Returns available ERC-20 tokens for the DAO's chain",
          content: {
            "application/json": {
              schema: DaoTokensResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const tokens = await service.getAvailableTokens();
      return context.json(tokens, 200);
    },
  );
}
