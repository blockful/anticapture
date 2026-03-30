import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  TreasuryResponseSchema,
  TreasuryQuerySchema,
} from "@/mappers/treasury";
import {} from "@/mappers";
import { TreasuryService } from "@/services/treasury";

export function treasury(
  app: Hono,
  treasuryService: TreasuryService,
  decimals: number,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getLiquidTreasury",
      path: "/treasury/liquid",
      summary: "Get liquid treasury data",
      description:
        "Get historical Liquid Treasury (treasury without DAO tokens) from external providers (DefiLlama/Dune)",
      tags: ["treasury"],
      request: {
        query: TreasuryQuerySchema,
      },
      responses: {
        200: {
          description: "Returns liquid treasury history",
          content: {
            "application/json": {
              schema: TreasuryResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, orderDirection = "asc" } = context.req.valid("query");
      const result = await treasuryService.getLiquidTreasury(
        days / (24 * 60 * 60),
        orderDirection,
      );
      return context.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getDaoTokenTreasury",
      path: "/treasury/dao-token",
      summary: "Get DAO token treasury data",
      description:
        "Get historical DAO Token Treasury value (governance token quantity × token price)",
      tags: ["treasury"],
      request: {
        query: TreasuryQuerySchema,
      },
      responses: {
        200: {
          description: "Returns DAO token treasury history",
          content: {
            "application/json": {
              schema: TreasuryResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, orderDirection = "asc" } = context.req.valid("query");
      const result = await treasuryService.getTokenTreasury(
        days / (24 * 60 * 60),
        orderDirection,
        decimals,
      );
      return context.json(result, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getTotalTreasury",
      path: "/treasury/total",
      summary: "Get total treasury data",
      description:
        "Get historical Total Treasury (liquid treasury + DAO token treasury)",
      tags: ["treasury"],
      request: {
        query: TreasuryQuerySchema,
      },
      responses: {
        200: {
          description: "Returns total treasury history",
          content: {
            "application/json": {
              schema: TreasuryResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { days, orderDirection = "asc" } = context.req.valid("query");
      const result = await treasuryService.getTotalTreasury(
        days / (24 * 60 * 60),
        orderDirection,
        decimals,
      );
      return context.json(result, 200);
    },
  );
}
