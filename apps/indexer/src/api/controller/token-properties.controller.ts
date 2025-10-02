import { DaoIdEnum } from "@/lib/enums";
import {
  CoingeckoTokenId,
  CoingeckoTokenIdEnum,
  CoingeckoTokenPropertyData,
} from "../services/coingecko/types";
import z from "zod";
import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

interface TokenPropertiesClient {
  getTokenProperties(
    tokenId: CoingeckoTokenId,
  ): Promise<CoingeckoTokenPropertyData>; // TODO
}

export function tokenProperties(
  app: Hono,
  client: TokenPropertiesClient,
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
              schema: z.object({
                value: z.number() /* TODO */,
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const tokenId =
        CoingeckoTokenIdEnum[daoId as keyof typeof CoingeckoTokenIdEnum];
      const data = await client.getTokenProperties(tokenId);

      return context.json(data, 200);
    },
  );
}
