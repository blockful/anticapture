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
      summary: "Get transactions with transfers and delegations",
      description:
        "Get transactions with their associated transfers and delegations, with optional filtering and sorting",
      tags: ["transactions"],
      request: {
        query: TransfersRequestSchema,
      },
      responses: {
        200: {
          description:
            "Returns transactions with their transfers and delegations",
          content: {
            "application/json": {
              schema: TransfersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { limit, offset, sortBy, sortOrder, from, to } =
        context.req.valid("query");

      const result = await service.getTransfers({
        limit,
        offset,
        sortBy,
        sortOrder,
        from,
        to,
      });

      return context.json(result);
    },
  );
}
