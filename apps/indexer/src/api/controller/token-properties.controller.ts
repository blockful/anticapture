import { CurrencyEnum, CurrencyOptions, DaoIdEnum } from "@/lib/enums";
import {
  CoingeckoIdToDaoId,
  CoingeckoTokenId,
  CoingeckoTokenIdEnum,
  CoingeckoTokenPriceCompareData,
} from "../services/coingecko/types";
import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { TokenService } from "../services/token/token";
import { TokenPropertiesResponseSchema, TokenMapper } from "../mappers";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

interface TokenPriceClient {
  getTokenPrice(
    tokenId: CoingeckoTokenId,
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<CoingeckoTokenPriceCompareData>;
}

export function tokenProperties(
  app: Hono,
  client: TokenPriceClient,
  service: TokenService,
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
      request: {
        query: z.object({
          currency: z.enum(CurrencyOptions).default(CurrencyEnum.USD),
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
      const tokenId =
        CoingeckoTokenIdEnum[daoId as keyof typeof CoingeckoTokenIdEnum];
      const tokenContractAddress =
        CONTRACT_ADDRESSES[CoingeckoIdToDaoId[tokenId]].token.address;
      const tokenProps = await service.getTokenProperties(tokenId);
      const priceData = await client.getTokenPrice(
        tokenId,
        tokenContractAddress,
        currency,
      );

      if (!tokenProps) {
        return context.json({ error: "Token not found" }, 404);
      }

      return context.json(
        TokenMapper.toApi(
          tokenProps,
          priceData,
          tokenContractAddress.toLowerCase(),
          currency,
        ),
        200,
      );
    },
  );
}
