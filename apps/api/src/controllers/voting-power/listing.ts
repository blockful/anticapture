import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { Address } from "viem";

import {
  VotingPowersRequestSchema,
  VotingPowersResponseSchema,
  VotingPowerResponseSchema,
  VotingPowerByAccountIdRequestParamsSchema,
  VotingPowerByAccountIdRequestQuerySchema,
  AmountFilter,
  DBAccountPowerWithVariation,
} from "@/mappers/";
import { setCacheControl } from "@/middlewares";

interface VotingPowerService {
  getVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy:
      | "votingPower"
      | "delegationsCount"
      | "variation"
      | "total"
      | "balance"
      | "signedVariation",
    amountFilter: AmountFilter,
    addresses: Address[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{ items: DBAccountPowerWithVariation[]; totalCount: number }>;

  getVotingPowersByAccountId(
    accountId: Address,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBAccountPowerWithVariation>;
}

export function votingPowers(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowers",
      path: "/voting-powers",
      summary: "Get voting powers",
      description: "Returns sorted and paginated account voting power records",
      tags: ["voting-power", "skip-pagination"],
      middleware: [setCacheControl(60)],
      request: {
        query: VotingPowersRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: VotingPowersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        limit,
        skip,
        orderDirection,
        orderBy,
        addresses,
        fromValue,
        toValue,
        fromDate,
        toDate,
      } = context.req.valid("query");

      const response = await service.getVotingPowers(
        skip,
        limit,
        orderDirection,
        orderBy,
        {
          minAmount: fromValue,
          maxAmount: toValue,
        },
        addresses,
        fromDate,
        toDate,
      );

      return context.json(
        VotingPowersResponseSchema.parse({
          ...response,
          items: response.items.map((r) => ({
            ...r,
            variation: {
              percentageChange: r.percentageChange,
              absoluteChange: r.absoluteChange,
            },
          })),
        }),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowerByAccountId",
      path: "/voting-powers/{accountId}",
      summary: "Get account powers",
      description:
        "Returns voting power information for a specific address (account)",
      tags: ["voting-power"],
      middleware: [setCacheControl(60)],
      request: {
        params: VotingPowerByAccountIdRequestParamsSchema,
        query: VotingPowerByAccountIdRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: VotingPowerResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { accountId } = context.req.valid("param");
      const { fromDate, toDate } = context.req.valid("query");
      const result = await service.getVotingPowersByAccountId(
        accountId,
        fromDate,
        toDate,
      );
      return context.json(
        VotingPowerResponseSchema.parse({
          ...result,
          variation: {
            percentageChange: result.percentageChange,
            absoluteChange: result.absoluteChange,
          },
        }),
        200,
      );
    },
  );
}
