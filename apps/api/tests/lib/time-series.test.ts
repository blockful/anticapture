import { forwardFill, createDailyTimeline } from "@/lib/time-series";
import { truncateTimestampToMidnight } from "@/lib/date-helpers";
import { SECONDS_IN_DAY } from "@/lib/enums";

describe("time-series", () => {
  describe("forwardFill", () => {
    it("should return filled map when all timeline points have data", () => {
      const timeline = [1, 2, 3];
      const sparseData = new Map([
        [1, 10],
        [2, 20],
        [3, 30],
      ]);

      const result = forwardFill(timeline, sparseData);

      expect(result.get(1)).toBe(10);
      expect(result.get(2)).toBe(20);
      expect(result.get(3)).toBe(30);
      expect(result.size).toBe(3);
    });

    it("should forward-fill gaps in the middle of timeline", () => {
      const timeline = [1, 2, 3, 4, 5];
      const sparseData = new Map([
        [1, 10],
        [5, 50],
      ]);

      const result = forwardFill(timeline, sparseData);

      expect(result.get(1)).toBe(10);
      expect(result.get(2)).toBe(10); // forward-filled
      expect(result.get(3)).toBe(10); // forward-filled
      expect(result.get(4)).toBe(10); // forward-filled
      expect(result.get(5)).toBe(50);
    });

    it("should use initialValue for timeline points before first data", () => {
      const timeline = [1, 2, 3];
      const sparseData = new Map([[3, 30]]);
      const initialValue = 9;

      const result = forwardFill(timeline, sparseData, initialValue);

      expect(result.get(1)).toBe(9); // uses initialValue
      expect(result.get(2)).toBe(9); // uses initialValue
      expect(result.get(3)).toBe(30);
    });

    it("should not fill timeline points before first data without initialValue", () => {
      const timeline = [1, 2, 3];
      const sparseData = new Map([[3, 30]]);

      const result = forwardFill(timeline, sparseData);

      expect(result.has(1)).toBe(false);
      expect(result.has(2)).toBe(false);
      expect(result.get(3)).toBe(30);
      expect(result.size).toBe(1);
    });

    it("should return empty map when timeline is empty", () => {
      const timeline: number[] = [];
      const sparseData = new Map([[1, 10]]);

      const result = forwardFill(timeline, sparseData);

      expect(result.size).toBe(0);
    });

    it("should work with bigint keys", () => {
      const timeline = [1n, 2n, 3n];
      const sparseData = new Map([[1n, 100]]);

      const result = forwardFill(timeline, sparseData);

      expect(result.get(1n)).toBe(100);
      expect(result.get(2n)).toBe(100);
      expect(result.get(3n)).toBe(100);
    });

    it("should work with string keys", () => {
      const timeline = ["2020-01-01", "2020-01-02", "2020-01-03"];
      const sparseData = new Map([["2020-01-01", 10]]);

      const result = forwardFill(timeline, sparseData);

      expect(result.get("2020-01-01")).toBe(10);
      expect(result.get("2020-01-02")).toBe(10);
      expect(result.get("2020-01-03")).toBe(10);
    });

    it("should work with object values", () => {
      const timeline = [1, 2, 3];
      const obj = { value: 100, name: "test" };
      const sparseData = new Map([[1, obj]]);

      const result = forwardFill(timeline, sparseData);

      expect(result.get(1)).toBe(obj);
      expect(result.get(2)).toBe(obj);
      expect(result.get(3)).toBe(obj);
    });
  });

  describe("createDailyTimeline", () => {
    it("should return single day when first and last timestamp are the same", () => {
      const timestamp = 1600041600;
      const result = createDailyTimeline(timestamp, timestamp);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(timestamp);
    });

    it("should return 3 days for a 3-day range", () => {
      const firstTimestamp = 1600041600;
      const lastTimestamp = 1600041600 + 2 * SECONDS_IN_DAY;
      const result = createDailyTimeline(firstTimestamp, lastTimestamp);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(firstTimestamp);
      expect(result[1]).toBe(firstTimestamp + SECONDS_IN_DAY);
      expect(result[2]).toBe(firstTimestamp + 2 * SECONDS_IN_DAY);
    });

    it("should return empty array when firstTimestamp > lastTimestamp", () => {
      const firstTimestamp = 1600214400;
      const lastTimestamp = 1600041600;
      const result = createDailyTimeline(firstTimestamp, lastTimestamp);

      expect(result).toHaveLength(0);
    });

    it("should return empty array when firstTimestamp is Infinity", () => {
      const result = createDailyTimeline(Infinity, 1600041600);
      expect(result).toHaveLength(0);
    });

    it("should use today as lastTimestamp when not provided", () => {
      const firstTimestamp = truncateTimestampToMidnight(
        Math.floor(Date.now() / 1000) - 2 * SECONDS_IN_DAY,
      );
      const todayMidnight = truncateTimestampToMidnight(
        Math.floor(Date.now() / 1000),
      );
      const result = createDailyTimeline(firstTimestamp);

      expect(result).toHaveLength(3);
      expect(result[result.length - 1]).toBe(todayMidnight);
    });
  });
});
