import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { VotingPowerService } from "../services";
import {
  TopVotingPowerVariationsMapper,
  TopVotingPowerVariationsRequestSchema,
  TopVotingPowerVariationsResponseSchema,
} from "../mappers/top-voting-power-variation";

export function topVotingPowerVariations(
  app: Hono,
  service: VotingPowerService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "topVotingPowerVariations",
      path: "/voting-power/variations",
      summary: "Get top changes in voting power for a given period",
      description:
        "Returns a mapping of the biggest changes to voting power associated by delegate address",
      tags: ["proposals"],
      request: {
        query: TopVotingPowerVariationsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: TopVotingPowerVariationsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, limit, skip, orderDirection } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);

      const result = await service.getTopVotingPowerVariations(
        now,
        days,
        skip,
        limit,
        orderDirection,
      );

      return context.json(TopVotingPowerVariationsMapper(result, now, days));
    },
  );
}
