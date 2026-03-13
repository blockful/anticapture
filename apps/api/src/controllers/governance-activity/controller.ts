import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DaysEnum, DaysOpts } from "@/lib/enums";
import { GovernanceActivityService } from "@/services";

export function governanceActivity(
  app: Hono,
  service: GovernanceActivityService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareActiveSupply",
      path: "/active-supply/compare",
      summary: "Get active token supply for DAO",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .openapi({
              example: "90d",
            })
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Active supply value",
          content: {
            "application/json": {
              schema: z
                .object({
                  activeSupply: z.string(),
                })
                .openapi({
                  example: {
                    activeSupply: "1000000000000000000000000",
                  },
                }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const data = await service.getActiveSupply(now - days);
      return context.json({ activeSupply: data?.activeSupply || "0" });
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareProposals",
      path: "/proposals/compare",
      summary: "Compare number of proposals between time periods",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Proposal comparison",
          content: {
            "application/json": {
              schema: z.object({
                currentProposalsLaunched: z.number(),
                oldProposalsLaunched: z.number(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const data = await service.getProposals(now - days);
      return context.json(data);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareVotes",
      path: "/votes/compare",
      summary: "Compare number of votes between time periods",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Vote comparison",
          content: {
            "application/json": {
              schema: z.object({
                currentVotes: z.number(),
                oldVotes: z.number(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const data = await service.getVotes(now - days);
      return context.json(data);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "compareAverageTurnout",
      path: "/average-turnout/compare",
      summary: "Compare average turnout between time periods",
      tags: ["governance"],
      request: {
        query: z.object({
          days: z
            .enum(DaysOpts)
            .default("90d")
            .transform((val) => DaysEnum[val]),
        }),
      },
      responses: {
        200: {
          description: "Average turnout comparison",
          content: {
            "application/json": {
              schema: z.object({
                currentAverageTurnout: z.string(),
                oldAverageTurnout: z.string(),
                changeRate: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { days } = context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);
      const data = await service.getAverageTurnout(now - days);
      return context.json(data);
    },
  );
}
