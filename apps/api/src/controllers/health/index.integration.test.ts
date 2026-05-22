import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DAOClient } from "@/clients";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { HealthRepositoryImpl } from "@/repositories/health";
import { HealthService } from "@/services/health";

import { health } from ".";

const fakeDaoClient: DAOClient = {
  getDaoId: () => "test",
  getVotingDelay: async () => 0n,
  getVotingPeriod: async () => 0n,
  getTimelockDelay: async () => 0n,
  getQuorum: async () => 0n,
  getProposalThreshold: async () => 0n,
  getCurrentBlockNumber: async () => 12345,
  getBlockTime: async () => 0,
  alreadySupportCalldataReview: () => false,
  supportOffchainData: () => false,
  calculateQuorum: () => 0n,
  getProposalStatus: async () => "PENDING",
};

describe("health controller", () => {
  let client: PGlite;
  let db: Drizzle;
  let app: Hono;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });

    app = new Hono();
    health(app, new HealthService(new HealthRepositoryImpl(db), fakeDaoClient));
  });

  afterAll(async () => {
    await client.close();
  });

  describe("GET /health (liveness)", () => {
    it("returns 200 when the database is reachable", async () => {
      const response = await app.request("/health");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ database: "ok" });
    });

    it("returns 503 when the database ping fails", async () => {
      const failingClient = new PGlite();
      const failingDb = drizzle(failingClient, { schema });
      const failingApp = new Hono();

      health(
        failingApp,
        new HealthService(new HealthRepositoryImpl(failingDb), fakeDaoClient),
      );
      await failingClient.close();

      const response = await failingApp.request("/health");

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ database: "error" });
    });
  });

  describe("GET /health/full (rich snapshot)", () => {
    it("returns 200 with status='degraded' when database is alive but indexer is stale", async () => {
      const response = await app.request("/health/full");

      // No feedEvent rows -> lastEventTimestamp null -> fresh=false -> degraded.
      // PGlite is reachable, so database=ok and status=degraded with 200.
      expect(response.status).toBe(200);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.database).toBe("ok");
      expect(body.status).toBe("degraded");
      expect(body.chain).toEqual({ head: 12345 });
      expect(body.indexer).toMatchObject({
        lastEventTimestamp: null,
        lagSeconds: null,
        fresh: false,
      });
    });

    it("returns 503 when the database ping fails", async () => {
      const failingClient = new PGlite();
      const failingDb = drizzle(failingClient, { schema });
      const failingApp = new Hono();

      health(
        failingApp,
        new HealthService(new HealthRepositoryImpl(failingDb), fakeDaoClient),
      );
      await failingClient.close();

      const response = await failingApp.request("/health/full");

      expect(response.status).toBe(503);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.database).toBe("error");
      expect(body.status).toBe("error");
    });
  });
});
