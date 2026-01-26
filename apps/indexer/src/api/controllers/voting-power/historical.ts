import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { VotingPowerService } from "@/api/services";
import {
  HistoricalVotingPowerResponseSchema,
  HistoricalVotingPowerRequestSchema,
  HistoricalVotingPowerMapper,
} from "@/api/mappers";
import { toLowerCaseAddress } from "@/lib/utils";

export function historicalVotingPowers(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "historicalVotingPowers",
      path: "/voting-powers/{accountId}/historical",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes",
      tags: ["proposals"],
      request: {
        params: z.object({
          accountId: z.string().transform((addr) => toLowerCaseAddress(addr)),
        }),
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
        skip,
        limit,
        orderDirection,
        orderBy,
        fromValue,
        toValue,
        fromDate,
        toDate,
      } = context.req.valid("query");
      const { accountId } = context.req.valid("param");

      const { items, totalCount } = await service.getHistoricalVotingPowers(
        accountId,
        skip,
        limit,
        orderDirection,
        orderBy,
        fromValue,
        toValue,
        fromDate,
        toDate,
      );
      return context.json(HistoricalVotingPowerMapper(items, totalCount));
    },
  );
}
