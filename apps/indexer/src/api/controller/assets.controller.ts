import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaysOpts } from "@/lib/enums";

interface TreasuryClient {
  getHistoricalTreasury(params: {
    days?: number;
    order?: "asc" | "desc";
  }): Promise<
    Array<{
      date: bigint;
      totalTreasury: number;
      treasuryWithoutDaoToken: number;
    }>
  >;
  syncTreasury?(): Promise<{
    synced: number;
    unchanged: number;
  }>;
}

export function assets(app: Hono, service: TreasuryClient) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "totalAssets",
      path: "/total-assets",
      summary: "Get total assets",
      description: "Get historical treasury data (total and without DAO token)",
      tags: ["assets"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("7d")
            .transform((val) => parseInt(val.replace("d", ""))),
          order: z.enum(["asc", "desc"]).optional().default("asc"),
        }),
      },
      responses: {
        200: {
          description: "Returns the total assets by day",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  date: z.number().describe("Unix timestamp in milliseconds"),
                  totalTreasury: z.number(),
                  treasuryWithoutDaoToken: z.number(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, order } = context.req.valid("query");

      // Fetch from database via treasury service
      const data = await service.getHistoricalTreasury({ days, order });

      const response = data.map((item) => ({
        date: Number(item.date) * 1000, // Convert seconds to milliseconds
        totalTreasury: item.totalTreasury,
        treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
      }));

      return context.json(response);
    },
  );
}
