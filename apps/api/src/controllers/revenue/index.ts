import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  RevenueActionsResponseSchema,
  RevenueActiveNamesResponseSchema,
  RevenueByCategoryResponseSchema,
  RevenueNewWalletsResponseSchema,
  RevenueQuerySchema,
  RevenueRenewalFunnelResponseSchema,
  RevenueRenewalTenureResponseSchema,
  RevenueTotalsResponseSchema,
} from "@/mappers/revenue";
import { DEGRADED_CACHE_HEADERS } from "@/lib/degraded-upstream";
import { setCacheControl } from "@/middlewares";
import {
  RevenueDuneClient,
  type RevenueMeta,
  ensOnly,
  filterByRange,
} from "@/services/revenue";

/**
 * Without a Dune key there is nothing to serve and no time to report. It is a
 * degraded answer, not an empty month, so the dashboard can say so.
 */
const UNCONFIGURED_RESPONSE: {
  items: never[];
  totalCount: number;
  meta: RevenueMeta;
} = {
  items: [],
  totalCount: 0,
  meta: { asOf: null, degraded: true },
};

/**
 * A stale copy or an empty fallback must not be stored downstream for the
 * route's regular TTL: the gateway would keep serving it after Dune recovers.
 */
const cacheHeadersFor = (meta: RevenueMeta) =>
  meta.degraded ? DEGRADED_CACHE_HEADERS : undefined;

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
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchActions();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => {
        const byDate = a.date - b.date;
        if (byDate !== 0) return sign * byDate;
        return sign * a.category.localeCompare(b.category);
      });

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
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
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchActiveNames();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
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
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchNewWallets();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
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
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchRenewalFunnel();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
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
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchRevenueTotals();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => sign * (a.date - b.date));

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRevenueByCategory",
      path: "/revenue/by-category",
      summary: "Get monthly ENS revenue split by category (Steakhouse ledger)",
      description:
        "Monthly ENS revenue split by category (Registration vs Renewal) in USD and ETH, sourced from the Steakhouse accounting ledger.",
      tags: ["revenue"],
      middleware: [ensOnly, setCacheControl(60)],
      request: {
        query: RevenueQuerySchema,
      },
      responses: {
        200: {
          description: "Monthly ENS revenue split by category in USD and ETH",
          content: {
            "application/json": {
              schema: RevenueByCategoryResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { fromDate, toDate, orderDirection } = context.req.valid("query");

      if (!revenueDuneClient) {
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchRevenueByCategory();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => {
        const byDate = a.date - b.date;
        if (byDate !== 0) return sign * byDate;
        return sign * a.category.localeCompare(b.category);
      });

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
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
        return context.json(UNCONFIGURED_RESPONSE, 200, DEGRADED_CACHE_HEADERS);
      }

      const { items, meta } = await revenueDuneClient.fetchRenewalTenure();
      const filtered = filterByRange(items, fromDate, toDate);
      const sign = orderDirection === "desc" ? -1 : 1;
      const sorted = [...filtered].sort((a, b) => {
        const byDate = a.date - b.date;
        if (byDate !== 0) return sign * byDate;
        return sign * a.tenureBucket.localeCompare(b.tenureBucket);
      });

      return context.json(
        { items: sorted, totalCount: sorted.length, meta },
        200,
        cacheHeadersFor(meta),
      );
    },
  );
}
