import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { VotingPowerService } from "@/api/services";
import {
  VotingPowerResponseSchema,
  VotingPowerRequestSchema,
  VotingPowerMapper,
} from "../mappers";

export function votingPower(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowers",
      path: "/voting-powers",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes",
      tags: ["proposals"],
      request: {
        query: VotingPowerRequestSchema,
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
      const { account, skip, limit, orderDirection } =
        context.req.valid("query");

      const { items, totalCount } = await service.getVotingPowers(
        account,
        skip,
        limit,
        orderDirection,
      );
      return context.json(VotingPowerMapper(items, totalCount));
    },
  );
}
