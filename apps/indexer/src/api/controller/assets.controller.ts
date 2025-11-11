import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaysOpts } from "@/lib/enums";

interface TreasuryClient {
  getHistoricalTreasury(days?: number): Promise<
    Array<{
      date: string;
      totalTreasury: string;
      treasuryWithoutDaoToken: string;
    }>
  >;
  syncTreasury?(): Promise<{
    inserted: number;
    updated: number;
    unchanged: number;
    stoppedEarly: boolean;
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
          // TODO add sort by date and remove sorting from apps/dashboard/features/attack-profitability/utils/normalizeDataset.ts:19
          days: z
            .enum(DaysOpts)
            .default("7d")
            .transform((val) => parseInt(val.replace("d", ""))),
        }),
      },
      responses: {
        200: {
          description: "Returns the total assets by day",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  date: z.string(),
                  totalTreasury: z.string(),
                  treasuryWithoutDaoToken: z.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");

      // Fetch from database via treasury service
      const data = await service.getHistoricalTreasury(days);

      // Return both treasury values for frontend flexibility
      const response = data.map((item) => ({
        date: item.date,
        totalTreasury: item.totalTreasury,
        treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
      }));

      return context.json(response);
    },
  );

  // TESTING ENDPOINT: Manual treasury sync trigger
  app.openapi(
    createRoute({
      method: "post",
      operationId: "syncTreasury",
      path: "/sync-treasury",
      summary: "Manually trigger treasury sync (TEST ONLY)",
      description: "Fetches latest data from DeFi Llama and syncs to database",
      tags: ["assets"],
      responses: {
        200: {
          description: "Sync completed successfully",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
                inserted: z.number(),
                updated: z.number(),
                unchanged: z.number(),
                stoppedEarly: z.boolean(),
              }),
            },
          },
        },
        501: {
          description: "Sync not available",
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
                inserted: z.number(),
                updated: z.number(),
                unchanged: z.number(),
                stoppedEarly: z.boolean(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      if (!service.syncTreasury) {
        return context.json(
          {
            message: "Sync not available",
            inserted: 0,
            updated: 0,
            unchanged: 0,
            stoppedEarly: false,
          },
          501,
        );
      }

      const result = await service.syncTreasury();

      return context.json({
        message: "Treasury sync completed",
        inserted: result.inserted,
        updated: result.updated,
        unchanged: result.unchanged,
        stoppedEarly: result.stoppedEarly,
      });
    },
  );
}
