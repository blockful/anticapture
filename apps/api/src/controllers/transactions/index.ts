import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  TransactionsRequestSchema,
  TransactionsResponseSchema,
} from "@/mappers/";
import { setCacheControl } from "@/middlewares";
import { TransactionsService } from "@/services";

export function transactions(app: Hono, service: TransactionsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "transactions",
      path: "/transactions",
      summary: "Get transactions with transfers and delegations",
      description:
        "Get transactions with their associated transfers and delegations, with optional filtering and sorting",
      tags: ["transactions"],
      request: {
        query: TransactionsRequestSchema,
      },
      responses: {
        200: {
          description:
            "Returns transactions with their transfers and delegations",
          content: {
            "application/json": {
              schema: TransactionsResponseSchema,
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
        fromDate,
        toDate,
        from,
        to,
        minAmount,
        maxAmount,
        affectedSupply,
        includes,
      } = context.req.valid("query");

      const result = await service.getTransactions({
        limit,
        skip,
        orderDirection,
        fromDate,
        toDate,
        from,
        to,
        minAmount,
        maxAmount,
        affectedSupply,
        includes,
      });

      setCacheControl(context, 60);
      return context.json(result, 200);
    },
  );
}
