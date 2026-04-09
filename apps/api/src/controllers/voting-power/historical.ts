import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  HistoricalVotingPowersResponseSchema,
  HistoricalVotingPowerRequestQuerySchema,
  HistoricalVotingPowersResponseMapper,
  HistoricalVotingPowerRequestParamsSchema,
  HistoricalVotingPowerGlobalQuerySchema,
  DBHistoricalVotingPowerWithRelations,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { Address } from "viem";

export interface HistoricalVotingPowerService {
  getHistoricalVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<{
    items: DBHistoricalVotingPowerWithRelations[];
    totalCount: number;
  }>;
}

export function historicalVotingPower(
  app: Hono,
  service: HistoricalVotingPowerService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPowerByAccountId",
      path: "/accounts/{address}/voting-powers/historical",
      summary: "Get voting power changes by account",
      description:
        "Returns a list of voting power changes for a specific account",
      tags: ["voting-power"],
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
      setCacheControl(context, 60);
      return context.json(
        HistoricalVotingPowersResponseMapper(items, totalCount),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPower",
      path: "/voting-powers/historical",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes.",
      tags: ["voting-power"],
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
        address,
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
      setCacheControl(context, 60);
      return context.json(
        HistoricalVotingPowersResponseMapper(items, totalCount),
        200,
      );
    },
  );
}
