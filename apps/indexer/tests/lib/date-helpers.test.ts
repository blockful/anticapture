import {
  truncateTimestampToMidnight,
  calculateCutoffTimestamp,
  normalizeMapTimestamps,
} from "@/lib/date-helpers";
import { SECONDS_IN_DAY } from "@/lib/enums";

describe("date-helpers", () => {
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
