import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { VotingPowerService } from "@/api/services";
import {
  HistoricalVotingPowerResponseSchema,
  HistoricalVotingPowerRequestSchema,
  HistoricalVotingPowerMapper,
} from "@/api/mappers";

export function votingPower(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPowers",
      path: "/voting-powers/historical",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes",
      tags: ["proposals"],
      request: {
        query: HistoricalVotingPowerRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: HistoricalVotingPowerResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        account,
        skip,
        limit,
        orderDirection,
        orderBy,
        minDelta,
        maxDelta,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getHistoricalVotingPowers(
        account,
        skip,
        limit,
        orderDirection,
        orderBy,
        minDelta,
        maxDelta,
      );
      return context.json(HistoricalVotingPowerMapper(items, totalCount));
    },
  );
}
