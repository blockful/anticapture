import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  DelegationsRequestSchema,
  DelegationsResponseSchema,
} from "@/api/mappers/delegations";

// where: {
//     daoId: $daoId
//     delegatorAccountId_in: $delegator
//     delegateAccountId: $delegate
//   }

// (
//     where: {
//       delegatorAccountId: $delegator
//       delegateAccountId: $delegate
//       delegatedValue_gte: $minDelta
//       delegatedValue_lte: $maxDelta
//     }
//     orderBy: $orderBy
//     orderDirection: $orderDirection
//     limit: $limit
//     after: $after
//     before: $before
//   ) {

// (where: { delegatorAccountId: $delegator })

export function delegations(app: Hono) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "delegations",
      path: "/delegations",
      summary: "Get delegations",
      description: "Get delegations, with optional filtering and sorting",
      tags: ["delegations"],
      request: {
        query: DelegationsRequestSchema,
      },
      responses: {
        200: {
          description:
            "Returns transactions with their transfers and delegations",
          content: {
            "application/json": {
              schema: DelegationsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        limit,
        delegatorAccountId,
        delegateAccountId,
        minDelta,
        maxDelta,
        skip,
        orderBy,
        orderDirection,
      } = context.req.valid("query");

      const result = await service.getDelegations({
        delegatorAccountId,
        delegateAccountId,
        minDelta,
        maxDelta,
        skip,
        limit,
        orderBy,
        orderDirection,
      });

      return context.json(result);
    },
  );
}
