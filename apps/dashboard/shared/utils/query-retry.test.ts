import { shouldRetryQuery } from "@/shared/utils/query-retry";

describe("shouldRetryQuery", () => {
  it("does not retry HTTP errors, whatever the status", () => {
    expect(shouldRetryQuery(0, { status: 503 })).toBe(false);
    expect(shouldRetryQuery(0, { status: 404 })).toBe(false);
    expect(
      shouldRetryQuery(0, Object.assign(new Error("x"), { status: 500 })),
    ).toBe(false);
  });

  it("retries a network error once", () => {
    const networkError = new TypeError("Failed to fetch");
    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(1, networkError)).toBe(false);
  });

  it("treats unknown error shapes as retryable network errors", () => {
    expect(shouldRetryQuery(0, undefined)).toBe(true);
    expect(shouldRetryQuery(0, "boom")).toBe(true);
  });
});
