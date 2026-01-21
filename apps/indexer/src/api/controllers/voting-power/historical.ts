import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { VotingPowerService } from "@/api/services";
import {
  HistoricalVotingPowersResponseSchema,
  HistoricalVotingPowerRequestQuerySchema,
  HistoricalVotingPowersResponseMapper,
  HistoricalVotingPowerRequestParamsSchema,
} from "@/api/mappers";

export function historicalVotingPowers(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPowers",
      path: "/accounts/{address}/voting-powers/historical",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes",
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
        address,
        skip,
        limit,
        orderDirection,
        orderBy,
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
