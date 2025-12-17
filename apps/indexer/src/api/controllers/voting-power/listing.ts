import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { VotingPowerService } from "@/api/services";
import {
  VotingPowersRequestSchema,
  VotingPowersResponseSchema,
  VotingPowersMapper,
  VotingPowerResponseSchema,
} from "@/api/mappers/";
import { isAddress } from "viem";
import { VotingPowerMapper } from "@/api/mappers/voting-power/voting-power-variations";

export function votingPowers(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowers",
      path: "/voting-powers",
      summary: "Get voting powers",
      description: "TODO",
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
        addresses,
        powerGreaterThan,
        powerLessThan,
      } = context.req.valid("query");

      const { items, totalCount } = await service.getVotingPowers(
        skip,
        limit,
        orderDirection,
        {
          minAmount: powerGreaterThan,
          maxAmount: powerLessThan,
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
      summary: "TODO",
      description: "TODO",
      tags: ["proposals"],
      request: {
        params: z.object({
          accountId: z.string().refine((addr) => isAddress(addr)),
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
