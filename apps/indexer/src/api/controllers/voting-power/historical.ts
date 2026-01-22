import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { VotingPowerService } from "@/api/services";
import {
  HistoricalVotingPowersResponseSchema,
  HistoricalVotingPowerRequestQuerySchema,
  HistoricalVotingPowersResponseMapper,
  HistoricalVotingPowerRequestParamsSchema,
  HistoricalVotingPowerGlobalQuerySchema,
} from "@/api/mappers";

export function historicalVotingPowerByAccount(
  app: Hono,
  service: VotingPowerService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPowerByAccount",
      path: "/accounts/{address}/voting-powers/historical",
      summary: "Get voting power changes by account",
      description:
        "Returns a list of voting power changes for a specific account",
      tags: ["proposals"],
      request: {
        params: HistoricalVotingPowerRequestParamsSchema,
        query: HistoricalVotingPowerRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: HistoricalVotingPowersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const {
        skip,
        limit,
        orderDirection,
        orderBy,
        fromValue,
        toValue,
        fromDate,
        toDate,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getHistoricalVotingPowers(
        skip,
        limit,
        orderDirection,
        orderBy,
        address,
        fromValue,
        toValue,
        fromDate,
        toDate,
      );
      return context.json(
        HistoricalVotingPowersResponseMapper(items, totalCount),
      );
    },
  );
}

export function historicalVotingPower(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPower",
      path: "/voting-powers/historical",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes.",
      tags: ["proposals"],
      request: {
        query: HistoricalVotingPowerGlobalQuerySchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: HistoricalVotingPowersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        skip,
        limit,
        orderDirection,
        orderBy,
        fromValue,
        toValue,
        fromDate,
        toDate,
        accountId,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getHistoricalVotingPowers(
        skip,
        limit,
        orderDirection,
        orderBy,
        accountId,
        fromValue,
        toValue,
        fromDate,
        toDate,
      );
      return context.json(
        HistoricalVotingPowersResponseMapper(items, totalCount),
      );
    },
  );
}
