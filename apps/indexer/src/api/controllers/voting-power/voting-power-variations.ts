import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { VotingPowerService } from "@/api/services";
import {
  VotingPowerVariationsMapper,
  VotingPowerVariationsRequestSchema,
  VotingPowerVariationsResponseSchema,
} from "@/api/mappers/";

export function votingPowerVariations(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowerVariations",
      path: "/voting-power/variations",
      summary: "Get top changes in voting power for a given period",
      description:
        "Returns a mapping of the biggest changes to voting power associated by delegate address",
      tags: ["proposals"],
      request: {
        query: VotingPowerVariationsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: VotingPowerVariationsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, limit, skip, orderDirection } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);

      const result = await service.getVotingPowerVariations(
        now - days,
        skip,
        limit,
        orderDirection,
      );

      return context.json(VotingPowerVariationsMapper(result, now, days));
    },
  );
}
