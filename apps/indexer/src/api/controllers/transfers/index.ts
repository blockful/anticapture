import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { TransfersService } from "@/api/services";
import {
  TransfersRequestSchema,
  TransfersResponseSchema,
} from "@/api/mappers/";

export function transfers(app: Hono, service: TransfersService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "transfers",
      path: "/transfers",
      summary: "Get transfers",
      description: "Get transfers, with optional filtering and sorting",
      tags: ["transfers"],
      request: {
        query: TransfersRequestSchema,
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
      const {
        limit,
        offset,
        sortBy,
        sortOrder,
        from,
        to,
        fromValue,
        toValue,
        fromDate,
      } = context.req.valid("query");

      const result = await service.getTransfers({
        limit,
        offset,
        sortBy,
        sortOrder,
        from,
        to,
        fromValue,
        toValue,
        fromDate,
      });

      return context.json(result);
    },
  );
}
