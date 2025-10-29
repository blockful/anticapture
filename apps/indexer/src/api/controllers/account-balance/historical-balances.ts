import { isAddress } from "viem";
import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaoIdEnum, DaysOpts, DaysEnum } from "@/lib/enums";
import {
  HistoricalBalancesService,
  HistoricalBalancesRequest,
  HistoricalVotingPowerService,
} from "@/api/services";

export function historicalOnchain(
  app: Hono,
  daoId: DaoIdEnum,
  votingPowerService: HistoricalVotingPowerService,
) {
  const balancesService = new HistoricalBalancesService();

  // Historical Balances endpoint
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalBalances",
      path: "/historical-balances",
      summary: "Get historical token balances",
      description:
        "Fetch historical token balances for multiple addresses at a specific time period using multicall",
      tags: ["historical-onchain"],
      request: {
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
          days: z
            .enum(DaysOpts)
            .default("7d")
            .transform((val) => DaysEnum[val]),
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
      const { addresses, days } = context.req.valid("query");

      const request: HistoricalBalancesRequest = {
        addresses,
        daysInSeconds: days,
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
      path: "/historical-voting-power",
      summary: "Get historical voting power",
      description:
        "Fetch historical voting power for multiple addresses at a specific time period using multicall",
      tags: ["historical-onchain"],
      request: {
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
          days: z
            .enum(DaysOpts)
            .default("7d")
            .transform((val) => DaysEnum[val]),
          fromDate: z.coerce.number().optional(),
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
                  votingPower: z.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (context) => {
      const { addresses, days, fromDate } = context.req.valid("query");

      const votingPowers = await votingPowerService.getHistoricalVotingPower(
        addresses,
        days,
        fromDate || Math.floor(Date.now() / 1000),
      );

      return context.json(votingPowers);
    },
  );
}
