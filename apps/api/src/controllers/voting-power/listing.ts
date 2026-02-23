import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import {
  VotingPowersRequestSchema,
  VotingPowersResponseSchema,
  VotingPowersMapper,
  VotingPowerResponseSchema,
} from "@/mappers/";
import { VotingPowerMapper } from "@/mappers/voting-power/variations";
import { VotingPowerService } from "@/services";

export function votingPowers(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowers",
      path: "/voting-powers",
      summary: "Get voting powers",
      description: "Returns sorted and paginated account voting power records",
      tags: ["proposals"],
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
      } = context.req.valid("query");

      const { items, totalCount } = await service.getVotingPowers(
        skip,
        limit,
        orderDirection,
        orderBy,
        {
          minAmount: fromValue,
          maxAmount: toValue,
        },
        addresses,
      );

      return context.json(VotingPowersMapper(items, totalCount));
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
      tags: ["proposals"],
      request: {
        params: z.object({
          accountId: z
            .string()
            .refine((addr) => isAddress(addr, { strict: false }))
            .transform((addr) => getAddress(addr)),
        }),
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
      const result = await service.getVotingPowersByAccountId(accountId);
      return context.json(VotingPowerMapper(result));
    },
  );
}
