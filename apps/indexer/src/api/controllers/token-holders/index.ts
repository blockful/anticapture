import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { Address } from "viem";
import {
  TokenHoldersMapper,
  TokenHoldersRequestSchema,
  TokenHoldersResponseSchema,
} from "@/api/mappers/token-holders";
import { TokenHoldersService } from "@/api/services/token-holders";

export function tokenHolders(app: Hono, service: TokenHoldersService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "tokenHolders",
      path: "/token-holders",
      summary: "Get token holders with balance and variation data",
      description: `Returns a paginated list of token holders with their current balance, delegate, and balance variation over the specified time period.

Supports sorting by:
- \`balance\`: Current token balance
- \`variation\`: Balance change over the period (signed value: positive = gained, negative = lost)

Supports filtering by:
- \`address\`: Filter by specific holder address
- \`delegate\`: Filter by delegate address, or use "nonzero" to exclude zero-address delegates`,
      tags: ["token-holders"],
      request: {
        query: TokenHoldersRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved token holders",
          content: {
            "application/json": {
              schema: TokenHoldersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, orderBy, orderDirection, limit, skip, address, delegate } =
        context.req.valid("query");

      const now = Math.floor(Date.now() / 1000);
      const startTimestamp = now - days;

      const result = await service.getTokenHolders(
        startTimestamp,
        skip,
        limit,
        orderBy,
        orderDirection,
        {
          address: address as Address | undefined,
          delegate: delegate as "nonzero" | Address | undefined,
        },
      );

      return context.json(TokenHoldersMapper(result, now, days));
    },
  );
}
