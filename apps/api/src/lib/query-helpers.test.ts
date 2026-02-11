import { filterWithFallback, getLastValueBefore } from "@/lib/query-helpers";

describe("query-helpers", () => {
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
});
