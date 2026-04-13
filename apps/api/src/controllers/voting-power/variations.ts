import { Address } from "viem";
import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  VotingPowerVariationsByAccountIdRequestQuerySchema,
  VotingPowerVariationsByAccountIdResponseSchema,
  VotingPowerVariationsByAccountIdResponseMapper,
  VotingPowerVariationsResponseSchema,
  VotingPowerVariationsResponseMapper,
  VotingPowerVariationsRequestQuerySchema,
  VotingPowerVariationsByAccountIdRequestParamsSchema,
  DBVotingPowerVariation,
} from "@/mappers/";

export interface VotingPowerVariationsService {
  getVotingPowerVariations(
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    addresses?: Address[],
  ): Promise<DBVotingPowerVariation[]>;

  getVotingPowerVariationsByAccountId(
    accountId: Address,
    startTimestamp: number | undefined,
    endTimestamp: number | undefined,
  ): Promise<DBVotingPowerVariation>;
}

export function votingPowerVariations(
  app: Hono,
  service: VotingPowerVariationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowerVariations",
      path: "/accounts/voting-powers/variations",
      summary:
        "Get voting power changes within a time frame for the given addresses",
      description:
        "Returns a mapping of the voting power changes within a time frame for the given addresses",
      tags: ["voting-power", "skip-pagination"],
      request: {
        query: VotingPowerVariationsRequestQuerySchema,
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
        fromDate,
        toDate,
        skip,
        limit,
        orderDirection,
        addresses,
      );

      return context.json(
        VotingPowerVariationsResponseMapper(result, fromDate, toDate),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "votingPowerVariationsByAccountId",
      path: "/accounts/{address}/voting-powers/variations",
      summary:
        "Get top changes in voting power for a given period for a single account",
      description:
        "Returns a the changes to voting power by period and accountId",
      tags: ["voting-power"],
      request: {
        params: VotingPowerVariationsByAccountIdRequestParamsSchema,
        query: VotingPowerVariationsByAccountIdRequestQuerySchema,
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
      const { address } = context.req.valid("param");
      const { fromDate, toDate } = context.req.valid("query");

      const result = await service.getVotingPowerVariationsByAccountId(
        address,
        fromDate,
        toDate,
      );

      return context.json(
        VotingPowerVariationsByAccountIdResponseMapper(
          result,
          fromDate,
          toDate,
        ),
        200,
      );
    },
  );
}
