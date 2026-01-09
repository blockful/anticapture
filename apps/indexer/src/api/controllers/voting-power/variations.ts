import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { VotingPowerService } from "@/api/services";
import {
  VotingPowerVariationsByAccountIdRequestSchema,
  VotingPowerVariationsByAccountIdResponseSchema,
  VotingPowerVariationsByAccountIdMapper,
  VotingPowerVariationsRequestSchema,
  VotingPowerVariationsResponseSchema,
  VotingPowerVariationsMapper,
} from "@/api/mappers/";
import { Address, isAddress } from "viem";

export function votingPowerVariations(app: Hono, service: VotingPowerService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowerVariations",
      path: "/voting-powers/variations",
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
      const { addresses, fromDate, toDate, limit, skip, orderDirection } =
        context.req.valid("query");

      const result = await service.getVotingPowerVariations(
        addresses,
        fromDate,
        toDate,
        skip,
        limit,
        orderDirection,
      );

      return context.json(
        VotingPowerVariationsMapper(result, toDate, toDate - fromDate),
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowerVariationsByAccountId",
      path: "/voting-powers/{accountId}/variations",
      summary:
        "Get top changes in voting power for a given period for a single account",
      description:
        "Returns a the changes to voting power by period and accountId",
      tags: ["proposals"],
      request: {
        params: z.object({
          accountId: z.string().refine((addr) => isAddress(addr)),
        }),
        query: VotingPowerVariationsByAccountIdRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved voting power changes",
          content: {
            "application/json": {
              schema: VotingPowerVariationsByAccountIdResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { accountId } = context.req.valid("param");
      const { fromDate, toDate } = context.req.valid("query");

      const result = await service.getVotingPowerVariationsByAccountId(
        accountId as Address,
        fromDate,
        toDate,
      );

      return context.json(
        VotingPowerVariationsByAccountIdMapper(
          result,
          toDate,
          toDate - fromDate,
        ),
      );
    },
  );
}
