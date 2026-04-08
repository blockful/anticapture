import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  TransfersRequestRouteSchema,
  TransfersRequestQuerySchema,
  TransfersResponseSchema,
} from "@/mappers/";
import { TransfersService } from "@/services";

export function transfers(app: Hono, service: TransfersService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "transfers",
      path: "/accounts/{address}/transfers",
      summary: "Get transfers",
      description: "Get transfers of a given address",
      tags: ["transfers"],
      request: {
        params: TransfersRequestRouteSchema,
        query: TransfersRequestQuerySchema,
      },
      responses: {
        200: {
          description: "Returns transfers",
          content: {
            "application/json": {
              schema: TransfersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const { from, to } = context.req.valid("query");
      const {
        limit,
        skip: offset,
        orderBy,
        orderDirection = "asc",
        fromValue,
        toValue,
        fromDate,
        toDate,
      } = context.req.valid("query");

      const result = await service.getTransfers({
        address,
        limit,
        skip: offset,
        orderBy,
        orderDirection,
        from,
        to,
        fromValue,
        toValue,
        fromDate,
        toDate,
      });

      context.header("Cache-Control", "public, max-age=60");
      return context.json(result, 200);
    },
  );
}
