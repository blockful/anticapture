import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { TreasuryService } from "@/api/services/treasury";
import {
  TreasuryResponseSchema,
  TreasuryQuerySchema,
} from "@/api/mappers/treasury";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { env } from "@/env";

export function treasury(app: Hono, treasuryService: TreasuryService) {
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
      const { days, order } = context.req.valid("query");
      const result = await treasuryService.getLiquidTreasury(days, order);
      return context.json(result);
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
        400: {
          description: "Invalid DAO ID or missing configuration",
        },
      },
    }),
    async (context) => {
      const { days, order } = context.req.valid("query");
      const decimals = CONTRACT_ADDRESSES[env.DAO_ID].token.decimals;
      const result = await treasuryService.getTokenTreasury(
        days,
        order,
        decimals,
      );
      return context.json(result);
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
        400: {
          description: "Invalid DAO ID or missing configuration",
        },
      },
    }),
    async (context) => {
      const { days, order } = context.req.valid("query");
      const decimals = CONTRACT_ADDRESSES[env.DAO_ID].token.decimals;
      const result = await treasuryService.getTotalTreasury(
        days,
        order,
        decimals,
      );
      return context.json(result);
    },
  );
}
