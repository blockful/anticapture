import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { TokenPropertiesResponseSchema, TokenMapper } from "@/mappers";
import { TokenService } from "@/services";

interface TokenPriceClient {
  getTokenPrice(
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<string>;
}

export function token(
  app: Hono,
  client: TokenPriceClient,
  service: TokenService,
  daoId: DaoIdEnum,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "token",
      path: "/token",
      summary: "Get token properties",
      description: "Get property data for a specific token",
      tags: ["tokens"],
      request: {
        query: z.object({
          currency: z.enum(["eth", "usd"]).default("usd"),
        }),
      },
      responses: {
        200: {
          description:
            "Returns data concerning token-specific values and attributes",
          content: {
            "application/json": {
              schema: TokenPropertiesResponseSchema,
            },
          },
        },
        404: {
          description: "Token not found",
        },
      },
    }),
    async (context) => {
      const { currency } = context.req.valid("query");

      const _contracts = CONTRACT_ADDRESSES[daoId];
      const tokenContractAddress =
        "token" in _contracts ? _contracts.token.address : undefined;
      const tokenProps = await service.getTokenProperties(daoId);
      const priceData = tokenContractAddress
        ? await client.getTokenPrice(tokenContractAddress, currency)
        : null;

      if (!tokenProps) {
        return context.json({ error: "Token not found" }, 404);
      }

      return context.json(TokenMapper.toApi(tokenProps, priceData ?? ""), 200);
    },
  );
}
