import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaysEnum } from "@/lib/enums";
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
      tags: ["transactions", "skip-pagination"],
      middleware: [setCacheControl(60)],
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
      const now = Math.floor(Date.now() / 1000);
      const fromTimestamp = fromDate ?? now - DaysEnum["90d"];
      const toTimestamp = toDate ?? now;

      const result = await service.getTransactions({
        limit,
        skip,
        orderDirection,
        fromDate: fromTimestamp,
        toDate: toTimestamp,
        from,
        to,
        minAmount,
        maxAmount,
        affectedSupply,
        includes,
      });

      return context.json(result, 200);
    },
  );
}
