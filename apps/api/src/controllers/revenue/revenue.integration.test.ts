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

import { env } from "@/env";
import actionsFixture from "@/services/revenue/__fixtures__/actions.json";
import activeNamesFixture from "@/services/revenue/__fixtures__/active-names.json";
import {
  REVENUE_QUERY_KEYS,
  RevenueDuneClient,
  RevenueDuneUrls,
} from "@/services/revenue/dune-client";

import { revenue } from "./index";

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
});
