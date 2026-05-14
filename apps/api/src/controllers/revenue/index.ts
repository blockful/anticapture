import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  RevenueActionsResponseSchema,
  RevenueQuerySchema,
} from "@/mappers/revenue";
import { setCacheControl } from "@/middlewares";
import { RevenueDuneClient, ensOnly, filterByRange } from "@/services/revenue";

export function revenue(app: Hono, revenueDuneClient?: RevenueDuneClient) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueActions",
      path: "/revenue/actions",
      summary: "Get monthly ENS action counts by category",
      description:
        "Monthly action counts by category (Registration, Renewal, Premium).",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description: "Monthly action counts by category",
          content: {
            "application/json": {
              schema: RevenueActionsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate, toDate, orderDirection } = context.req.valid("query");

      if (!revenueDuneClient) {
        return context.json({ items: [], totalCount: 0 }, 200);
      }

      const rows = await revenueDuneClient.fetchActions();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => {
        const byDate = a.date - b.date;
        if (byDate !== 0) return sign * byDate;
        return sign * a.category.localeCompare(b.category);
      });

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );
}
