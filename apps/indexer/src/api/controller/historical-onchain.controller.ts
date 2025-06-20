import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { Address, isAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";
import {
  HistoricalBalancesService,
  HistoricalBalancesRequest,
} from "../services/historical-balances";
import {
  HistoricalVotingPowerService,
  HistoricalVotingPowerRequest,
} from "../services/historical-voting-power";

export function historicalOnchain(app: Hono) {
  const balancesService = new HistoricalBalancesService();
  const votingPowerService = new HistoricalVotingPowerService();

  // Historical Balances endpoint
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalBalances",
      path: "/historical-balances/{daoId}",
      summary: "Get historical token balances",
      description:
        "Fetch historical token balances for multiple addresses at a specific block number using multicall",
      tags: ["historical-onchain"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          addresses: z
            .array(z.string())
            .min(1, "At least one address is required")
            .refine((addresses) =>
              addresses.every((address) => isAddress(address)),
            )
            .or(
              z
                .string()
                .refine((addr) => isAddress(addr), "Invalid Ethereum address")
                .transform((addr) => [addr]),
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
              schema: z.array(
                z.object({
                  address: z.string(),
                  balance: z.string(), // BigInt serialized as string
                  blockNumber: z.number(),
                  tokenAddress: z.string(),
                }),
              ),
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

      const balances = await balancesService.getHistoricalBalances(request);

      return context.json(balances, 200);
    },
  );

  // Historical Voting Power endpoint
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPower",
      path: "/historical-voting-power/{daoId}",
      summary: "Get historical voting power",
      description:
        "Fetch historical voting power for multiple addresses at a specific block number using multicall",
      tags: ["historical-onchain"],
      request: {
        params: z.object({
          daoId: caseInsensitiveEnum(DaoIdEnum),
        }),
        query: z.object({
          addresses: z
            .array(z.string())
            .min(1, "At least one address is required")
            .refine((addresses) =>
              addresses.every((address) => isAddress(address)),
            )
            .or(
              z
                .string()
                .refine((addr) => isAddress(addr), "Invalid Ethereum address")
                .transform((addr) => [addr]),
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
              schema: z.array(
                z.object({
                  address: z.string(),
                  votingPower: z.string(), // BigInt serialized as string
                  blockNumber: z.number(),
                  tokenAddress: z.string(),
                }),
              ),
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

      const votingPowers =
        await votingPowerService.getHistoricalVotingPower(request);

      return context.json(votingPowers, 200);
    },
  );
}
