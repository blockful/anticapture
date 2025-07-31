import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { TransactionsService } from "../services/transactions";
import { 
  TransactionsRequestSchema, 
  TransactionsResponseSchema 
} from "../mappers/transactions";

export function transactions(app: Hono, service: TransactionsService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getTransactions",
      path: "/transactions",
      summary: "Get transactions with transfers and delegations",
      description: "Get transactions with their associated transfers and delegations, with optional filtering and sorting",
      tags: ["transactions"],
      request: {
        query: TransactionsRequestSchema,
      },
      responses: {
        200: {
          description: "Returns transactions with their transfers and delegations",
          content: {
            "application/json": {
              schema: TransactionsResponseSchema,
            },
          },
        },
      },
    }),
          async (context) => {
        const { limit, offset, sortBy, sortOrder, from, to, minVolume, maxVolume } = context.req.valid("query");

        const result = await service.getTransactionsWithChildren({
          limit,
          offset,
          sortBy,
          sortOrder,
          from,
          to,
          minVolume,
          maxVolume,
        });

      return context.json(result);
    },
  );
} 