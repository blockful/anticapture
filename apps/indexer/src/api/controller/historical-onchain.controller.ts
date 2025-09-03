import { isAddress } from "viem";
import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaoIdEnum, DaysOpts, DaysEnum } from "@/lib/enums";
import {
  HistoricalBalancesService,
  HistoricalBalancesRequest,
} from "../services/historical-balances";
import { HistoricalVotingPowerService } from "../services/historical-voting-power";

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
                  transactionHash: z.string(),
                  timestamp: z.string(),
                  delta: z.string(),
                  logIndex: z.number(),
                  delegation: z
                    .object({
                      delegateAccountId: z.string(),
                      delegatorAccountId: z.string(),
                      delegatedValue: z.string(),
                      previousDelegate: z.string().nullable(),
                    })
                    .optional(),
                  transfer: z
                    .object({
                      fromAccountId: z.string(),
                      toAccountId: z.string(),
                      amount: z.string().nullable(),
                      tokenId: z.string().nullable(),
                    })
                    .optional(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (context) => {
      const { addresses, days } = context.req.valid("query");

      const votingPowers = await votingPowerService.getHistoricalVotingPower(
        addresses,
        days,
      );

      // Serialize BigInt values to strings for JSON response
      const serializedVotingPowers = votingPowers.map((vp) => ({
        address: vp.address,
        votingPower: vp.votingPower.toString(),
        transactionHash: vp.transactionHash,
        timestamp: vp.timestamp.toString(),
        delta: vp.delta.toString(),
        logIndex: vp.logIndex,
        delegation: vp.delegation
          ? {
              delegateAccountId: vp.delegation.delegateAccountId,
              delegatorAccountId: vp.delegation.delegatorAccountId,
              delegatedValue: vp.delegation.delegatedValue.toString(),
              previousDelegate: vp.delegation.previousDelegate,
            }
          : undefined,
        transfer: vp.transfer
          ? {
              fromAccountId: vp.transfer.fromAccountId,
              toAccountId: vp.transfer.toAccountId,
              amount: vp.transfer.amount?.toString() ?? null,
              tokenId: vp.transfer.tokenId,
            }
          : undefined,
      }));

      return context.json(serializedVotingPowers);
    },
  );
}
