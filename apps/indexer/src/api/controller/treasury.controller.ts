import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { ZerionDaoLiquidTreasury } from "../services/zerion/types";

interface TreasuryClient {
  fetchDaoLiquidTreasury(
    addresses: string[],
    governanceToken: string,
  ): Promise<ZerionDaoLiquidTreasury>;
}

export function treasury(app: Hono, service: TreasuryClient) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "daoLiquidTreasury",
      path: "/dao/treasury",
      summary: "Get DAO liquid treasury",
      description:
        "Returns the DAO's liquid treasury in USD, aggregated across multiple addresses.",
      tags: ["treasury"],
      request: {
        query: z.object({
          addresses: z
            .union([z.string(), z.array(z.string())])
            .transform((val) => (typeof val === "string" ? [val] : val))
            .describe("List of DAO treasury addresses"),
          governanceToken: z
            .string()
            .min(1)
            .describe("Symbol of the governance token"),
        }),
      },
      responses: {
        200: {
          description: "Returns the liquid treasury calculation",
          content: {
            "application/json": {
              schema: z.object({
                totalUSD: z.number(),
                governanceUSD: z.number(),
                liquidUSD: z.number(),
                timestamp: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { addresses, governanceToken } = context.req.valid("query");
      const data = await service.fetchDaoLiquidTreasury(
        addresses,
        governanceToken,
      );
      return context.json(data);
    },
  );
}
