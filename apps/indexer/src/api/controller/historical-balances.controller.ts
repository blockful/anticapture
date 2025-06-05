import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  HistoricalBalancesService,
  HistoricalBalance,
  HistoricalBalancesRequest,
} from "../services/historical-balances";

export function historicalBalances(app: Hono) {
  const service = new HistoricalBalancesService();

  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalBalances",
      path: "/historical-balances/{daoId}",
      summary: "Get historical token balances",
      description:
        "Fetch historical token balances for multiple addresses at a specific block number using multicall",
      tags: ["historical-balances"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          addresses: z
            .string()
            .min(1, "At least one address is required")
            .transform((str) =>
              str.split(",").map((addr) => addr.trim() as Address)
            ),
          blockNumber: z.coerce
            .number()
            .int()
            .positive("Block number must be positive"),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved historical balances",
          content: {
            "application/json": {
              schema: z.object({
                data: z.array(
                  z.object({
                    address: z.string(),
                    balance: z.string(), // BigInt serialized as string
                    blockNumber: z.number(),
                    tokenAddress: z.string(),
                  })
                ),
              }),
            },
          },
        },
        400: {
          description: "Bad request - validation error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                message: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { daoId } = context.req.valid("param");
      const { addresses, blockNumber } = context.req.valid("query");

      const request: HistoricalBalancesRequest = {
        addresses,
        blockNumber,
        daoId,
      };

      const balances = await service.getHistoricalBalances(request);

      const response = {
        data: balances,
      };

      return context.json(response, 200);
    }
  );
}
