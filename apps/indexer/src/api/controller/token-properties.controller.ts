import { DaoIdEnum } from "@/lib/enums";
import {
  CoingeckoTokenId,
  CoingeckoTokenIdEnum,
  CoingeckoTokenPriceCompareData,
} from "../services/coingecko/types";
import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { TokensService } from "../services/tokens/tokens";
import { TokenPropertiesResponseSchema, TokensMapper } from "../mappers";

interface TokenPriceClient {
  getTokenPriceCompare(
    tokenId: CoingeckoTokenId,
    vsCurrency?: string,
  ): Promise<CoingeckoTokenPriceCompareData>;
}

export function tokenProperties(
  app: Hono,
  client: TokenPriceClient,
  service: TokensService,
  daoId: DaoIdEnum,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "tokenProperties",
      path: "/token/properties",
      summary: "Get token properties",
      description: "Get property data for a specific token",
      tags: ["tokens"],
      responses: {
        200: {
          description: "Returns the historical market data for the token",
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
      const tokenId =
        CoingeckoTokenIdEnum[daoId as keyof typeof CoingeckoTokenIdEnum];
      const priceData = await client.getTokenPriceCompare(tokenId);
      const tokenProps = await service.getTokenPropertiesById(tokenId);

      if (!tokenProps) {
        return context.json({ error: "Token not found" }, 404);
      }

      return context.json(TokensMapper.toApi(tokenProps, priceData), 200);
    },
  );
}
