import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  HistoricalVotingPowerService,
  HistoricalVotingPowerRequest,
} from "../services/historical-voting-power";

export function historicalVotingPower(app: Hono) {
  const service = new HistoricalVotingPowerService();

  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPower",
      path: "/historical-voting-power/{daoId}",
      summary: "Get historical voting power",
      description:
        "Fetch historical voting power for multiple addresses at a specific block number using multicall",
      tags: ["historical-voting-power"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          addresses: z
            .string()
            .min(1, "At least one address is required")
            .transform((str) =>
              str.split(",").map((addr) => addr.trim() as Address),
            ),
          blockNumber: z.coerce
            .number()
            .int()
            .positive("Block number must be positive"),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved historical voting power",
          content: {
            "application/json": {
              schema: z.object({
                data: z.array(
                  z.object({
                    address: z.string(),
                    votingPower: z.string(), // BigInt serialized as string
                    blockNumber: z.number(),
                    tokenAddress: z.string(),
                  }),
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

      const request: HistoricalVotingPowerRequest = {
        addresses,
        blockNumber,
        daoId,
      };

      const votingPowers = await service.getHistoricalVotingPower(request);

      const response = {
        data: votingPowers,
      };

      return context.json(response, 200);
    },
  );
}
