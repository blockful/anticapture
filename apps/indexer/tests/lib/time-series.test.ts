import {
  truncateTimestampToMidnight,
  forwardFill,
  createDailyTimeline,
  filterWithFallback,
  getLastValueBefore,
  calculateCutoffTimestamp,
  normalizeMapTimestamps,
} from "@/lib/time-series";
import { SECONDS_IN_DAY } from "@/lib/enums";

describe("time-series", () => {
  describe("truncateTimestampToMidnight", () => {
    it("should return same timestamp when already at midnight UTC", () => {
      const midnightTimestamp = 1600041600;
      const result = truncateTimestampToMidnight(midnightTimestamp);
      expect(result).toBe(1600041600);
    });

    it("should truncate timestamp from middle of day to midnight UTC", () => {
      const middayTimestamp = 1600084800; // 14/09/2020 12:00:00 UTC
      const result = truncateTimestampToMidnight(middayTimestamp);
      expect(result).toBe(1600041600);
    });

    it("should truncate timestamp from end of day to midnight UTC", () => {
      const endOfDayTimestamp = 1600127999; // 14/09/2020 23:59:59 UTC
      const result = truncateTimestampToMidnight(endOfDayTimestamp);
      expect(result).toBe(1600041600);
    });
  });

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

  describe("filterWithFallback", () => {
    it("should return filtered data when items exist after cutoff", () => {
      const data = [
        { date: 1, value: 10 },
        { date: 5, value: 50 },
        { date: 10, value: 100 },
      ];
      const result = filterWithFallback(data, 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: 5, value: 50 });
      expect(result[1]).toEqual({ date: 10, value: 100 });
    });

    it("should return last value before cutoff when no items after cutoff", () => {
      const data = [
        { date: 1, value: 10 },
        { date: 5, value: 50 },
      ];
      const result = filterWithFallback(data, 100);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ date: 5, value: 50 });
    });

    it("should return empty array when data is empty", () => {
      const data: { date: number; value: number }[] = [];
      const result = filterWithFallback(data, 5);

      expect(result).toHaveLength(0);
    });

    it("should return all data when cutoff is before all items", () => {
      const data = [
        { date: 10, value: 100 },
        { date: 20, value: 200 },
        { date: 30, value: 300 },
      ];
      const result = filterWithFallback(data, 1);

      expect(result).toHaveLength(3);
      expect(result).toEqual(data);
    });
  });

  describe("getLastValueBefore", () => {
    it("should return item before the given date", () => {
      const data = [
        { date: 1, value: 10 },
        { date: 5, value: 50 },
      ];
      const result = getLastValueBefore(data, 3);

      expect(result).toEqual({ date: 1, value: 10 });
    });

    it("should return the most recent item when multiple items exist before date", () => {
      const data = [
        { date: 1, value: 10 },
        { date: 5, value: 50 },
        { date: 10, value: 100 },
      ];
      const result = getLastValueBefore(data, 8);

      expect(result).toEqual({ date: 5, value: 50 });
    });

    it("should return undefined when no items exist before date", () => {
      const data = [
        { date: 10, value: 100 },
        { date: 20, value: 200 },
      ];
      const result = getLastValueBefore(data, 5);

      expect(result).toBeUndefined();
    });

    it("should return undefined when data is empty", () => {
      const data: { date: number; value: number }[] = [];
      const result = getLastValueBefore(data, 5);

      expect(result).toBeUndefined();
    });

    it("should not include item when beforeDate equals item date (exclusive)", () => {
      const data = [
        { date: 5, value: 50 },
        { date: 10, value: 100 },
      ];
      const result = getLastValueBefore(data, 5);

      expect(result).toBeUndefined();
    });
  });

  describe("calculateCutoffTimestamp", () => {
    it("should return current timestamp when days is 0", () => {
      const now = Math.floor(Date.now() / 1000);
      const result = calculateCutoffTimestamp(0);

      expect(result).toBeCloseTo(now);
    });

    it("should return timestamp 7 days ago", () => {
      const now = Math.floor(Date.now() / 1000);
      const expected = now - 7 * SECONDS_IN_DAY;
      const result = calculateCutoffTimestamp(7);

      expect(result).toBeCloseTo(expected);
    });

    it("should return timestamp 365 days ago", () => {
      const now = Math.floor(Date.now() / 1000);
      const expected = now - 365 * SECONDS_IN_DAY;
      const result = calculateCutoffTimestamp(365);

      expect(result).toBeCloseTo(expected);
    });
  });

  describe("normalizeMapTimestamps", () => {
    it("should normalize all timestamps to midnight UTC", () => {
      const day1Midday = 1600084800; // mid day
      const day2Midday = 1600171200; // mid day
      const map = new Map([
        [day1Midday, "day1"],
        [day2Midday, "day2"],
      ]);
      const result = normalizeMapTimestamps(map);

      expect(result.size).toBe(2);
      expect(result.get(1600041600)).toBe("day1"); // midnight
      expect(result.get(1600041600 + SECONDS_IN_DAY)).toBe("day2"); // midnight
    });

    it("should return empty map when input is empty", () => {
      const map = new Map<number, string>();
      const result = normalizeMapTimestamps(map);

      expect(result.size).toBe(0);
    });
  });
});
