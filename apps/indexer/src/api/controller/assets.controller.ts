import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaysOpts } from "@/lib/enums";

interface TreasuryClient {
  getHistoricalTreasury(days?: number): Promise<
    Array<{
      date: bigint;
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
                  date: z.number().describe("Unix timestamp in milliseconds"),
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

      // Convert bigint timestamp (seconds) to milliseconds for frontend
      const response = data.map((item) => ({
        date: Number(item.date) * 1000, // Convert seconds to milliseconds
        totalTreasury: item.totalTreasury,
        treasuryWithoutDaoToken: item.treasuryWithoutDaoToken,
      }));

      return context.json(response);
    },
  );
}
