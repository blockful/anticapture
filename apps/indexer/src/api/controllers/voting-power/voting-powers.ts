import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { VotingPowerService } from "@/api/services";
import {
  VotingPowerResponseSchema,
  VotingPowerRequestSchema,
  VotingPowerMapper,
} from "@/api/mappers";
import { isAddress } from "viem";

export function votingPower(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowers",
      path: "/voting-powers/{account}",
      summary: "Get voting power changes",
      description: "Returns a list of voting power changes",
      tags: ["proposals"],
      request: {
        params: z.object({
          account: z.string().refine((addr) => isAddress(addr)),
        }),
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
      const { account } = context.req.valid("param");
      const {
        fromAddresses,
        toAddresses,
        skip,
        limit,
        orderDirection,
        orderBy,
        minDelta,
        maxDelta,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getVotingPowers(
        account,
        skip,
        limit,
        orderDirection,
        orderBy,
        minDelta,
        maxDelta,
        fromAddresses,
        toAddresses,
      );
      return context.json(VotingPowerMapper(items, totalCount));
    },
  );
}
