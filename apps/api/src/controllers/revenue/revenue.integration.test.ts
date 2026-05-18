import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { DaoIdEnum } from "@/lib/enums";

vi.mock("@/env", () => ({
  env: { DAO_ID: "ENS" },
}));

import { docs } from "@/docs";
import { env } from "@/env";
import actionsFixture from "@/services/revenue/__fixtures__/actions.json";
import activeNamesFixture from "@/services/revenue/__fixtures__/active-names.json";
import newWalletsFixture from "@/services/revenue/__fixtures__/new-wallets.json";
import renewalFunnelFixture from "@/services/revenue/__fixtures__/renewal-funnel.json";
import renewalTenureFixture from "@/services/revenue/__fixtures__/renewal-tenure.json";
import revenueByCategoryFixture from "@/services/revenue/__fixtures__/revenue-by-category.json";
import revenueTotalsFixture from "@/services/revenue/__fixtures__/revenue-totals.json";
import {
  REVENUE_QUERY_KEYS,
  RevenueDuneClient,
  RevenueDuneUrls,
  RevenueQueryKey,
} from "@/services/revenue/dune-client";

import { revenue } from "./index";

type RevenueFixture = { result: { rows: unknown[] } };

type RevenueEndpointDef = {
  path: string;
  urlKey: RevenueQueryKey;
  fixture: RevenueFixture;
  operationId: string;
  responseSchemaName: string;
};

const REVENUE_ENDPOINTS: readonly RevenueEndpointDef[] = [
  {
    path: "/revenue/actions",
    urlKey: "actions",
    fixture: actionsFixture,
    operationId: "getRevenueActions",
    responseSchemaName: "RevenueActionsResponse",
  },
  {
    path: "/revenue/active-names",
    urlKey: "activeNames",
    fixture: activeNamesFixture,
    operationId: "getRevenueActiveNames",
    responseSchemaName: "RevenueActiveNamesResponse",
  },
  {
    path: "/revenue/new-wallets",
    urlKey: "newWallets",
    fixture: newWalletsFixture,
    operationId: "getRevenueNewWallets",
    responseSchemaName: "RevenueNewWalletsResponse",
  },
  {
    path: "/revenue/renewal-funnel",
    urlKey: "renewalFunnel",
    fixture: renewalFunnelFixture,
    operationId: "getRevenueRenewalFunnel",
    responseSchemaName: "RevenueRenewalFunnelResponse",
  },
  {
    path: "/revenue/totals",
    urlKey: "revenueTotals",
    fixture: revenueTotalsFixture,
    operationId: "getRevenueTotals",
    responseSchemaName: "RevenueTotalsResponse",
  },
  {
    path: "/revenue/by-category",
    urlKey: "revenueByCategory",
    fixture: revenueByCategoryFixture,
    operationId: "getRevenueByCategory",
    responseSchemaName: "RevenueByCategoryResponse",
  },
  {
    path: "/revenue/renewal-tenure",
    urlKey: "renewalTenure",
    fixture: renewalTenureFixture,
    operationId: "getRevenueRenewalTenure",
    responseSchemaName: "RevenueRenewalTenureResponse",
  },
];

const API_KEY = "test-api-key";
const FIXTURE_BASE = "https://dune.test";

function buildUrls(base = FIXTURE_BASE): RevenueDuneUrls {
  return REVENUE_QUERY_KEYS.reduce<RevenueDuneUrls>(
    (acc, key, idx) => ({ ...acc, [key]: `${base}/${idx}/results` }),
    {} as RevenueDuneUrls,
  );
}

function createTestApp(client?: RevenueDuneClient) {
  const app = new Hono();
  revenue(app, client);
  return app;
}

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Revenue Controller", () => {
  let urls: RevenueDuneUrls;

  beforeEach(() => {
    env.DAO_ID = DaoIdEnum.ENS;
    urls = buildUrls();
  });

  describe("GET /revenue/actions", () => {
    it("returns happy-path data sorted ascending by [date, category]", async () => {
      server.use(
        http.get(urls.actions, () => HttpResponse.json(actionsFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/actions");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: { date: number; category: string; actions: number }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(actionsFixture.result.rows.length);
      expect(body.items).toHaveLength(actionsFixture.result.rows.length);
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        if (prev.date !== curr.date) {
          expect(prev.date).toBeLessThan(curr.date);
        } else {
          expect(
            prev.category.localeCompare(curr.category),
          ).toBeLessThanOrEqual(0);
        }
      }
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/actions");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/actions");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.actions, () => HttpResponse.json(actionsFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/actions?orderDirection=desc");

      const body = (await res.json()) as {
        items: { date: number; category: string }[];
      };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        if (prev.date !== curr.date) {
          expect(prev.date).toBeGreaterThan(curr.date);
        } else {
          expect(
            prev.category.localeCompare(curr.category),
          ).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("filters by fromDate and toDate", async () => {
      server.use(
        http.get(urls.actions, () => HttpResponse.json(actionsFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const feb1 = Math.floor(Date.UTC(2026, 1, 1) / 1000);
      const feb1ToEnd = await app.request(`/revenue/actions?fromDate=${feb1}`);
      const feb1ToEndBody = (await feb1ToEnd.json()) as {
        items: { date: number }[];
        totalCount: number;
      };
      expect(feb1ToEndBody.items.every((item) => item.date >= feb1)).toBe(true);
      expect(feb1ToEndBody.totalCount).toBe(feb1ToEndBody.items.length);
      expect(feb1ToEndBody.items.length).toBeLessThan(
        actionsFixture.result.rows.length,
      );

      const janOnlyClient = new RevenueDuneClient(API_KEY, urls);
      const janApp = createTestApp(janOnlyClient);
      const jan31 = Math.floor(Date.UTC(2026, 0, 31, 23, 59, 59) / 1000);
      const janOnly = await janApp.request(`/revenue/actions?toDate=${jan31}`);
      const janOnlyBody = (await janOnly.json()) as {
        items: { date: number }[];
      };
      expect(janOnlyBody.items.every((item) => item.date <= jan31)).toBe(true);
      expect(janOnlyBody.items.length).toBeGreaterThan(0);
    });
  });

  describe("GET /revenue/active-names", () => {
    it("returns happy-path data sorted ascending by date with mapped fields", async () => {
      server.use(
        http.get(urls.activeNames, () => HttpResponse.json(activeNamesFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/active-names");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: {
          date: number;
          netChange: number;
          cumulativeActive: number;
        }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(activeNamesFixture.result.rows.length);
      expect(body.items).toHaveLength(activeNamesFixture.result.rows.length);
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeLessThan(curr.date);
      }

      const first = body.items[0]!;
      const firstRaw = activeNamesFixture.result.rows[0]!;
      expect(first.netChange).toBe(firstRaw.net_change);
      expect(first.cumulativeActive).toBe(firstRaw.cumulative_active);
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/active-names");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/active-names");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.activeNames, () => HttpResponse.json(activeNamesFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request(
        "/revenue/active-names?orderDirection=desc",
      );
      const body = (await res.json()) as { items: { date: number }[] };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeGreaterThan(curr.date);
      }
    });
  });

  describe("GET /revenue/new-wallets", () => {
    it("returns happy-path data sorted ascending by date with mapped fields", async () => {
      server.use(
        http.get(urls.newWallets, () => HttpResponse.json(newWalletsFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/new-wallets");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: {
          date: number;
          newWallets: number;
          cumulativeWallets: number;
        }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(newWalletsFixture.result.rows.length);
      expect(body.items).toHaveLength(newWalletsFixture.result.rows.length);
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeLessThan(curr.date);
      }

      const first = body.items[0]!;
      const firstRaw = newWalletsFixture.result.rows[0]!;
      expect(first.newWallets).toBe(firstRaw.new_wallets);
      expect(first.cumulativeWallets).toBe(firstRaw.cumulative_wallets);
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/new-wallets");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/new-wallets");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.newWallets, () => HttpResponse.json(newWalletsFixture)),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/new-wallets?orderDirection=desc");
      const body = (await res.json()) as { items: { date: number }[] };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeGreaterThan(curr.date);
      }
    });
  });

  describe("GET /revenue/renewal-funnel", () => {
    it("returns happy-path data sorted ascending by date with mapped fields", async () => {
      server.use(
        http.get(urls.renewalFunnel, () =>
          HttpResponse.json(renewalFunnelFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/renewal-funnel");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: {
          date: number;
          termsExpiring: number;
          renewedCount: number;
          churnedCount: number;
          renewalRatePct: number;
        }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(renewalFunnelFixture.result.rows.length);
      expect(body.items).toHaveLength(renewalFunnelFixture.result.rows.length);
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeLessThan(curr.date);
      }

      const first = body.items[0]!;
      const firstRaw = renewalFunnelFixture.result.rows[0]!;
      expect(first.termsExpiring).toBe(firstRaw.terms_expiring);
      expect(first.renewedCount).toBe(firstRaw.renewed_count);
      expect(first.churnedCount).toBe(firstRaw.churned_count);
      expect(first.renewalRatePct).toBe(parseFloat(firstRaw.renewal_rate_pct));
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/renewal-funnel");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/renewal-funnel");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.renewalFunnel, () =>
          HttpResponse.json(renewalFunnelFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request(
        "/revenue/renewal-funnel?orderDirection=desc",
      );
      const body = (await res.json()) as { items: { date: number }[] };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeGreaterThan(curr.date);
      }
    });

    it("parses renewal_rate_pct strings with many decimals into finite numbers", async () => {
      server.use(
        http.get(urls.renewalFunnel, () =>
          HttpResponse.json(renewalFunnelFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/renewal-funnel");
      const body = (await res.json()) as {
        items: { renewalRatePct: number }[];
      };

      expect(body.items.length).toBeGreaterThan(0);
      for (const item of body.items) {
        expect(typeof item.renewalRatePct).toBe("number");
        expect(Number.isFinite(item.renewalRatePct)).toBe(true);
      }

      const highPrecisionRow = renewalFunnelFixture.result.rows.find((row) =>
        row.renewal_rate_pct.includes("61.7"),
      )!;
      const highPrecisionItem = body.items.find(
        (item) =>
          item.renewalRatePct === parseFloat(highPrecisionRow.renewal_rate_pct),
      );
      expect(highPrecisionItem).toBeDefined();
    });
  });

  describe("GET /revenue/totals", () => {
    it("returns happy-path data sorted ascending by date with mapped fields", async () => {
      server.use(
        http.get(urls.revenueTotals, () =>
          HttpResponse.json(revenueTotalsFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/totals");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: {
          date: number;
          registrationUsd: number;
          premiumUsd: number;
          renewalUsd: number;
          totalUsd: number;
          registrationEth: number;
          premiumEth: number;
          renewalEth: number;
        }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(revenueTotalsFixture.result.rows.length);
      expect(body.items).toHaveLength(revenueTotalsFixture.result.rows.length);
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeLessThan(curr.date);
      }

      const first = body.items[0]!;
      const firstRaw = revenueTotalsFixture.result.rows[0]!;
      expect(first.registrationUsd).toBe(firstRaw.registration_usd);
      expect(first.premiumUsd).toBe(firstRaw.premium_usd);
      expect(first.renewalUsd).toBe(firstRaw.renewal_usd);
      expect(first.totalUsd).toBe(firstRaw.total_usd);
      expect(first.registrationEth).toBe(firstRaw.registration_eth);
      expect(first.premiumEth).toBe(firstRaw.premium_eth);
      expect(first.renewalEth).toBe(firstRaw.renewal_eth);
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/totals");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/totals");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.revenueTotals, () =>
          HttpResponse.json(revenueTotalsFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/totals?orderDirection=desc");
      const body = (await res.json()) as { items: { date: number }[] };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        expect(prev.date).toBeGreaterThan(curr.date);
      }
    });

    it("returns non-zero premiumUsd and premiumEth for an April-2023-onward row", async () => {
      server.use(
        http.get(urls.revenueTotals, () =>
          HttpResponse.json(revenueTotalsFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const apr2023 = Math.floor(Date.UTC(2023, 3, 1) / 1000);
      const res = await app.request(`/revenue/totals?fromDate=${apr2023}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: { date: number; premiumUsd: number; premiumEth: number }[];
      };

      const aprilOrLater = body.items.filter((item) => item.date >= apr2023);
      expect(aprilOrLater.length).toBeGreaterThan(0);
      for (const item of aprilOrLater) {
        expect(item.premiumUsd).toBeGreaterThan(0);
        expect(item.premiumEth).toBeGreaterThan(0);
      }
    });
  });

  describe("GET /revenue/by-category", () => {
    it("returns happy-path data sorted ascending by [date, category] with mapped fields", async () => {
      server.use(
        http.get(urls.revenueByCategory, () =>
          HttpResponse.json(revenueByCategoryFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/by-category");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: {
          date: number;
          category: "Registration" | "Renewal";
          revenueUsd: number;
          revenueEth: number;
        }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(revenueByCategoryFixture.result.rows.length);
      expect(body.items).toHaveLength(
        revenueByCategoryFixture.result.rows.length,
      );
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        if (prev.date !== curr.date) {
          expect(prev.date).toBeLessThan(curr.date);
        } else {
          expect(
            prev.category.localeCompare(curr.category),
          ).toBeLessThanOrEqual(0);
        }
      }

      const first = body.items[0]!;
      const firstRaw = revenueByCategoryFixture.result.rows[0]!;
      expect(first.category).toBe(firstRaw.category);
      expect(first.revenueUsd).toBe(firstRaw.revenue_usd);
      expect(first.revenueEth).toBe(firstRaw.revenue_eth);
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/by-category");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/by-category");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.revenueByCategory, () =>
          HttpResponse.json(revenueByCategoryFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/by-category?orderDirection=desc");
      const body = (await res.json()) as {
        items: { date: number; category: "Registration" | "Renewal" }[];
      };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        if (prev.date !== curr.date) {
          expect(prev.date).toBeGreaterThan(curr.date);
        } else {
          expect(
            prev.category.localeCompare(curr.category),
          ).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("GET /revenue/renewal-tenure", () => {
    it("returns happy-path data sorted ascending by [date, tenureBucket] with mapped fields", async () => {
      server.use(
        http.get(urls.renewalTenure, () =>
          HttpResponse.json(renewalTenureFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/renewal-tenure");

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: {
          date: number;
          tenureBucket: string;
          names: number;
          totalRenewalsInBucket: number;
        }[];
        totalCount: number;
      };

      expect(body.totalCount).toBe(renewalTenureFixture.result.rows.length);
      expect(body.items).toHaveLength(renewalTenureFixture.result.rows.length);
      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        if (prev.date !== curr.date) {
          expect(prev.date).toBeLessThan(curr.date);
        } else {
          expect(
            prev.tenureBucket.localeCompare(curr.tenureBucket),
          ).toBeLessThanOrEqual(0);
        }
      }

      const first = body.items[0]!;
      const firstRaw = renewalTenureFixture.result.rows[0]!;
      expect(first.tenureBucket).toBe(firstRaw.tenure_bucket);
      expect(first.names).toBe(firstRaw.names);
      expect(first.totalRenewalsInBucket).toBe(
        firstRaw.total_renewals_in_bucket,
      );
    });

    it("returns 404 when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/renewal-tenure");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not Found" });
    });

    it("returns empty items when the revenue client is not instantiated", async () => {
      const app = createTestApp(undefined);

      const res = await app.request("/revenue/renewal-tenure");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: [], totalCount: 0 });
    });

    it("sorts descending when orderDirection=desc", async () => {
      server.use(
        http.get(urls.renewalTenure, () =>
          HttpResponse.json(renewalTenureFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request(
        "/revenue/renewal-tenure?orderDirection=desc",
      );
      const body = (await res.json()) as {
        items: { date: number; tenureBucket: string }[];
      };

      for (let i = 1; i < body.items.length; i++) {
        const prev = body.items[i - 1]!;
        const curr = body.items[i]!;
        if (prev.date !== curr.date) {
          expect(prev.date).toBeGreaterThan(curr.date);
        } else {
          expect(
            prev.tenureBucket.localeCompare(curr.tenureBucket),
          ).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("preserves far-future outlier rows when toDate is omitted", async () => {
      server.use(
        http.get(urls.renewalTenure, () =>
          HttpResponse.json(renewalTenureFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const res = await app.request("/revenue/renewal-tenure");

      const body = (await res.json()) as { items: { date: number }[] };
      const farFutureUnix = Math.floor(Date.UTC(8966, 6, 1) / 1000);
      expect(body.items.some((item) => item.date === farFutureUnix)).toBe(true);
    });

    it("excludes far-future outlier rows when toDate is near-term", async () => {
      server.use(
        http.get(urls.renewalTenure, () =>
          HttpResponse.json(renewalTenureFixture),
        ),
      );
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      const feb1 = Math.floor(Date.UTC(2026, 1, 1) / 1000);
      const res = await app.request(`/revenue/renewal-tenure?toDate=${feb1}`);

      const body = (await res.json()) as { items: { date: number }[] };
      const farFutureUnix = Math.floor(Date.UTC(8966, 6, 1) / 1000);
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every((item) => item.date <= feb1)).toBe(true);
      expect(body.items.some((item) => item.date === farFutureUnix)).toBe(
        false,
      );
    });
  });

  describe("Revenue API surface (US-011)", () => {
    it("returns 200 with the expected shape for every endpoint", async () => {
      for (const endpoint of REVENUE_ENDPOINTS) {
        server.use(
          http.get(urls[endpoint.urlKey], () =>
            HttpResponse.json(endpoint.fixture),
          ),
        );
      }
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      for (const endpoint of REVENUE_ENDPOINTS) {
        const res = await app.request(endpoint.path);
        expect(res.status, `unexpected status for ${endpoint.path}`).toBe(200);

        const body = (await res.json()) as {
          items: { date: number }[];
          totalCount: number;
        };
        expect(Array.isArray(body.items)).toBe(true);
        expect(typeof body.totalCount).toBe("number");
        expect(body.items.length).toBe(body.totalCount);
        expect(body.items.length).toBeGreaterThan(0);
        for (const item of body.items) {
          expect(typeof item.date).toBe("number");
        }
      }
    });

    it("caches upstream Dune calls within TTL for every endpoint", async () => {
      const callCounts: Record<RevenueQueryKey, number> = {
        actions: 0,
        activeNames: 0,
        newWallets: 0,
        renewalFunnel: 0,
        revenueTotals: 0,
        revenueByCategory: 0,
        renewalTenure: 0,
      };

      for (const endpoint of REVENUE_ENDPOINTS) {
        server.use(
          http.get(urls[endpoint.urlKey], () => {
            callCounts[endpoint.urlKey] += 1;
            return HttpResponse.json(endpoint.fixture);
          }),
        );
      }

      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      for (const endpoint of REVENUE_ENDPOINTS) {
        const first = await app.request(endpoint.path);
        const second = await app.request(endpoint.path);
        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
      }

      for (const endpoint of REVENUE_ENDPOINTS) {
        expect(
          callCounts[endpoint.urlKey],
          `expected exactly one upstream call for ${endpoint.path}`,
        ).toBe(1);
      }
    });

    it("returns 404 for every endpoint when DAO_ID is not ENS", async () => {
      env.DAO_ID = DaoIdEnum.UNI;
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);

      for (const endpoint of REVENUE_ENDPOINTS) {
        const res = await app.request(endpoint.path);
        expect(res.status, `expected 404 for ${endpoint.path}`).toBe(404);
        expect(await res.json()).toEqual({ error: "Not Found" });
      }
    });

    it("exposes every operationId in the OpenAPI document", async () => {
      const client = new RevenueDuneClient(API_KEY, urls);
      const app = createTestApp(client);
      docs(app);

      const res = await app.request("/docs");
      expect(res.status).toBe(200);

      type OpenApiOperation = {
        operationId?: string;
        responses?: {
          "200"?: {
            content?: {
              "application/json"?: {
                schema?: { $ref?: string };
              };
            };
          };
        };
      };
      type OpenApiDoc = {
        paths: Record<string, Record<string, OpenApiOperation>>;
      };
      const doc = (await res.json()) as OpenApiDoc;

      for (const endpoint of REVENUE_ENDPOINTS) {
        const operation = doc.paths[endpoint.path]?.get;
        expect(operation, `missing GET ${endpoint.path}`).toBeDefined();
        expect(operation?.operationId).toBe(endpoint.operationId);
        const ref =
          operation?.responses?.["200"]?.content?.["application/json"]?.schema
            ?.$ref;
        expect(ref, `missing 200 schema ref for ${endpoint.path}`).toBe(
          `#/components/schemas/${endpoint.responseSchemaName}`,
        );
      }
    });
  });
});
