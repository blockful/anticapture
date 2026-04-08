import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import {
  ErrorResponseSchema,
  TokenPropertiesResponseSchema,
  TokenMapper,
} from "@/mappers";
import { TokenService } from "@/services";

export interface TokenPriceClient {
  getTokenPrice(
    tokenContractAddress: string,
    targetCurrency: string,
  ): Promise<string>;
}

const TokenPropertiesQuerySchema = z
  .object({
    currency: z.enum(["eth", "usd"]).default("usd").openapi({
      description: "Currency to use when fetching token price data.",
      example: "usd",
    }),
  })
  .openapi("TokenPropertiesQuery");

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
        query: TokenPropertiesQuerySchema,
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
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { currency } = context.req.valid("query");

      const tokenContractAddress = CONTRACT_ADDRESSES[daoId].token.address;
      const tokenProps = await service.getTokenProperties(daoId);
      const priceData = await client.getTokenPrice(
        tokenContractAddress,
        currency,
      );

      if (!tokenProps) {
        return context.json(
          ErrorResponseSchema.parse({ error: "Token not found" }),
          404,
        );
      }

      context.header("Cache-Control", "public, max-age=3600");
      return context.json(TokenMapper.toApi(tokenProps, priceData), 200);
    },
  );
}
