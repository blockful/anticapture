import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, it, expect, beforeAll } from "vitest";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { EventRelevanceService } from "@/services";
import { eventRelevance } from "./index";

const compThresholds = getDaoRelevanceThreshold(DaoIdEnum.COMP);

describe("EventRelevance Controller", () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    const service = new EventRelevanceService(DaoIdEnum.COMP);
    eventRelevance(app, service);
  });

  describe("GET /event-relevance/threshold", () => {
    it("should return 200 with threshold string for TRANSFER/LOW", async () => {
      const res = await app.request(
        `/event-relevance/threshold?type=${FeedEventType.TRANSFER}&relevance=${FeedRelevance.LOW}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.threshold).toBe("string");
      expect(body.threshold).toBe(
        compThresholds[FeedEventType.TRANSFER][FeedRelevance.LOW].toString(),
      );
    });

    it("should return 200 with threshold '0' for PROPOSAL/HIGH (EMPTY_THRESHOLDS)", async () => {
      const res = await app.request(
        `/event-relevance/threshold?type=${FeedEventType.PROPOSAL}&relevance=${FeedRelevance.HIGH}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.threshold).toBe(
        compThresholds[FeedEventType.PROPOSAL][FeedRelevance.HIGH].toString(),
      );
    });

    it("should return 400 when required query params are missing", async () => {
      const res = await app.request("/event-relevance/threshold");

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid type param", async () => {
      const res = await app.request(
        `/event-relevance/threshold?type=INVALID&relevance=${FeedRelevance.LOW}`,
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid relevance param", async () => {
      const res = await app.request(
        `/event-relevance/threshold?type=${FeedEventType.TRANSFER}&relevance=INVALID`,
      );

      expect(res.status).toBe(400);
    });

    it("should return correct threshold for VOTE/MEDIUM", async () => {
      const res = await app.request(
        `/event-relevance/threshold?type=${FeedEventType.VOTE}&relevance=${FeedRelevance.MEDIUM}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.threshold).toBe(
        compThresholds[FeedEventType.VOTE][FeedRelevance.MEDIUM].toString(),
      );
    });
  });
});
