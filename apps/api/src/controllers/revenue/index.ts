import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  RevenueActionsResponseSchema,
  RevenueActiveNamesResponseSchema,
  RevenueByAccountQuerySchema,
  RevenueByAccountResponseSchema,
  RevenueNewWalletsResponseSchema,
  RevenuePremiumEthResponseSchema,
  RevenueQuerySchema,
  RevenueRenewalFunnelResponseSchema,
  RevenueRenewalTenureResponseSchema,
  RevenueTotalsResponseSchema,
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

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueActiveNames",
      path: "/revenue/active-names",
      summary: "Get monthly net change and cumulative active .eth names",
      description:
        "Monthly net change and cumulative count of active .eth names.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description:
            "Monthly net change and cumulative count of active .eth names",
          content: {
            "application/json": {
              schema: RevenueActiveNamesResponseSchema,
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

      const rows = await revenueDuneClient.fetchActiveNames();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueNewWallets",
      path: "/revenue/new-wallets",
      summary: "Get monthly new-wallet counts and cumulative wallet total",
      description:
        "Monthly new-wallet counts and the cumulative wallet total for ENS.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description:
            "Monthly new-wallet counts and the cumulative wallet total",
          content: {
            "application/json": {
              schema: RevenueNewWalletsResponseSchema,
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

      const rows = await revenueDuneClient.fetchNewWallets();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenuePremiumEth",
      path: "/revenue/premium-eth",
      summary: "Get monthly base/premium/total ETH from premium auctions",
      description:
        "Monthly base/premium/total ETH from temporary premium auctions. Data starts April 2023 (when premium auctions launched).",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description:
            "Monthly base/premium/total ETH from temporary premium auctions",
          content: {
            "application/json": {
              schema: RevenuePremiumEthResponseSchema,
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

      const rows = await revenueDuneClient.fetchPremiumEth();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueRenewalFunnel",
      path: "/revenue/renewal-funnel",
      summary: "Get monthly renewal funnel keyed by expiry month",
      description:
        "Renewal funnel per expiry month: terms expiring, renewed, churned, and renewal rate.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description:
            "Renewal funnel per expiry month: terms expiring, renewed, churned, and renewal rate.",
          content: {
            "application/json": {
              schema: RevenueRenewalFunnelResponseSchema,
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

      const rows = await revenueDuneClient.fetchRenewalFunnel();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueTotals",
      path: "/revenue/totals",
      summary: "Get monthly ENS revenue totals in USD and ETH",
      description:
        "Monthly ENS revenue totals split into registration, premium, and renewal, in both USD and ETH.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description: "Monthly ENS revenue totals in USD and ETH",
          content: {
            "application/json": {
              schema: RevenueTotalsResponseSchema,
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

      const rows = await revenueDuneClient.fetchRevenueTotals();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueByAccount",
      path: "/revenue/by-account",
      summary: "Get monthly ENS revenue per controller account",
      description:
        "Monthly revenue per controller account in USD and ETH, with an optional account filter.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueByAccountQuerySchema,
      },
      responses: {
        200: {
          description: "Monthly ENS revenue per controller account",
          content: {
            "application/json": {
              schema: RevenueByAccountResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate, toDate, orderDirection, account } =
        context.req.valid("query");

      if (!revenueDuneClient) {
        return context.json({ items: [], totalCount: 0 }, 200);
      }

      const rows = await revenueDuneClient.fetchRevenueByAccount();
      const ranged = filterByRange(rows, fromDate, toDate);
      const filtered =
        account == null
          ? ranged
          : ranged.filter((row) => row.account === account);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => {
        const byDate = a.date - b.date;
        if (byDate !== 0) return sign * byDate;
        return sign * (a.account - b.account);
      });

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueRenewalTenure",
      path: "/revenue/renewal-tenure",
      summary: "Get monthly renewal tenure distribution per expiry month",
      description:
        "Per expiry month, count of names in each tenure bucket (0/1/2/3+ renewals) and the total renewals in that bucket.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description:
            "Per expiry month, count of names in each tenure bucket and total renewals in that bucket",
          content: {
            "application/json": {
              schema: RevenueRenewalTenureResponseSchema,
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

      const rows = await revenueDuneClient.fetchRenewalTenure();
      const filtered = filterByRange(rows, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => {
        const byDate = a.date - b.date;
        if (byDate !== 0) return sign * byDate;
        return sign * a.tenureBucket.localeCompare(b.tenureBucket);
      });

      return context.json({ items: sorted, totalCount: sorted.length }, 200);
    },
  );
}
