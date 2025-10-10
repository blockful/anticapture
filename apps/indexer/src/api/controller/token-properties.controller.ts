import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaoIdEnum } from "@/lib/enums";
import { TokenService } from "@/api/services";
import { TokenPropertiesResponseSchema, TokenMapper } from "@/api/mappers";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

interface TokenPriceClient {
  getTokenPrice(
    daoId: DaoIdEnum,
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<number>;
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

      const tokenContractAddress = CONTRACT_ADDRESSES[daoId].token.address;
      const tokenProps = await service.getTokenProperties(daoId);
      const priceData = await client.getTokenPrice(
        daoId,
        tokenContractAddress,
        currency,
      );

      if (!tokenProps) {
        return context.json({ error: "Token not found" }, 404);
      }

      return context.json(TokenMapper.toApi(tokenProps, priceData), 200);
    },
  );
}
