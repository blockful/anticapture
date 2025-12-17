import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { DaysOpts } from "@/lib/enums";
import { TreasuryService } from "@/api/services/treasury";

export function assets(app: Hono, treasuryService: TreasuryService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "liquidTreasury",
      path: "/liquid-treasury",
      summary: "Get liquid treasury data",
      description:
        "Get historical Liquid Treasury (treasury without DAO tokens) directly from provider",
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
          description: "Returns the liquid treasury history",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  date: z.number().describe("Unix timestamp in milliseconds"),
                  liquidTreasury: z.number(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, order } = context.req.valid("query");
      const response = await treasuryService.getTreasuryHistory(days, order);
      return context.json(response);
    },
  );
}
