import { describe, it, expect } from "vitest";
import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { EventRelevanceService } from "./index";

const allEventTypes = Object.values(FeedEventType);
const allRelevanceLevels = Object.values(FeedRelevance);
const allDaoIds = Object.values(DaoIdEnum);

describe("EventRelevanceService", () => {
  describe("getThreshold", () => {
    it.each(allDaoIds)(
      "matches the value from getDaoRelevanceThreshold for %s",
      (daoId) => {
        const service = new EventRelevanceService(daoId);
        const thresholds = getDaoRelevanceThreshold(daoId);

        for (const eventType of allEventTypes) {
          for (const relevance of allRelevanceLevels) {
            const result = service.getThreshold(eventType, relevance);

            expect(result).toBe(thresholds[eventType][relevance].toString());
          }
        }
      },
    );
  });

  describe("threshold ordering", () => {
    it.each(allDaoIds)(
      "LOW <= MEDIUM <= HIGH for every event type in %s",
      (daoId) => {
        const service = new EventRelevanceService(daoId);

        for (const eventType of allEventTypes) {
          const low = BigInt(
            service.getThreshold(eventType, FeedRelevance.LOW),
          );
          const medium = BigInt(
            service.getThreshold(eventType, FeedRelevance.MEDIUM),
          );
          const high = BigInt(
            service.getThreshold(eventType, FeedRelevance.HIGH),
          );

          expect(low).toBeLessThanOrEqual(medium);
          expect(medium).toBeLessThanOrEqual(high);
        }
      },
    );
  });

  describe("PROPOSAL and PROPOSAL_EXTENDED always return '0'", () => {
    it.each(allDaoIds)("PROPOSAL thresholds are always '0' for %s", (daoId) => {
      const service = new EventRelevanceService(daoId);

      for (const relevance of allRelevanceLevels) {
        expect(service.getThreshold(FeedEventType.PROPOSAL, relevance)).toBe(
          "0",
        );
        expect(
          service.getThreshold(FeedEventType.PROPOSAL_EXTENDED, relevance),
        ).toBe("0");
      }
    });
  });
});
