import { humanizeDuration } from "@/shared/services/decoder/humanize/duration";
import { humanizeLeaf } from "@/shared/services/decoder/humanize";
import { humanizeNumber } from "@/shared/services/decoder/humanize/number";
import { humanizeTimestamp } from "@/shared/services/decoder/humanize/timestamp";
import {
  humanizeEtherValue,
  humanizeTokenAmount,
} from "@/shared/services/decoder/humanize/tokenAmount";

describe("humanizeDuration", () => {
  test("10 years in 365-day seconds", () => {
    expect(humanizeDuration(315_360_000n)?.text).toBe(
      "10 years = 315,360,000 seconds",
    );
  });

  test("singular unit", () => {
    expect(humanizeDuration(86_400n)?.text).toBe("1 day = 86,400 seconds");
  });

  test("two days in hours-free reading", () => {
    expect(humanizeDuration(172_800n)?.text).toBe("2 days = 172,800 seconds");
  });

  test("a value that is not a whole number of any unit returns null", () => {
    // 90,061s = 1 day + 1h + 1m + 1s; "25 hours" would make the "=" a lie.
    expect(humanizeDuration(90_061n)).toBeNull();
  });

  test("sub-minute values return null", () => {
    expect(humanizeDuration(42n)).toBeNull();
  });
});

describe("humanizeTimestamp", () => {
  test("epoch seconds inside the window render as a UTC date", () => {
    const result = humanizeTimestamp(1_767_225_600n); // 2026-01-01T00:00:00Z
    expect(result).toMatchObject({
      kind: "timestamp",
      iso: "2026-01-01T00:00:00.000Z",
    });
    expect(result?.text).toContain("2026");
    expect(result?.text).toContain("UTC");
  });

  test("values outside [2000, 2100) are not timestamps", () => {
    expect(humanizeTimestamp(1_000n)).toBeNull();
    expect(humanizeTimestamp(5_000_000_000n)).toBeNull();
  });
});

describe("humanizeNumber", () => {
  test("groups thousands", () => {
    expect(humanizeNumber(315_360_000n)?.text).toBe("315,360,000");
  });

  test("small numbers gain nothing and return null", () => {
    expect(humanizeNumber(42n)).toBeNull();
  });

  test("negative numbers keep the sign", () => {
    expect(humanizeNumber(-1_234_567n)?.text).toBe("-1,234,567");
  });
});

describe("humanizeTokenAmount", () => {
  test("25,000 USDC from 6-decimal raw units", () => {
    expect(humanizeTokenAmount(25_000_000_000n, 6, "USDC").text).toBe(
      "25,000 USDC",
    );
  });

  test("fractional amounts trim to 4 digits", () => {
    expect(humanizeTokenAmount(1_234_567n, 6, "USDC").text).toBe("1.2345 USDC");
  });
});

describe("humanizeEtherValue", () => {
  test("wei to ETH", () => {
    expect(humanizeEtherValue(1_500_000_000_000_000_000n).text).toBe("1.5 ETH");
  });
});

describe("humanizeLeaf", () => {
  test("only uint/int bigints qualify", () => {
    expect(humanizeLeaf({ type: "address", name: "to" }, "0xabc")).toBeNull();
    expect(humanizeLeaf({ type: "uint256", name: "x" }, "12345")).toBeNull();
  });

  test("timestamp hint wins over duration for in-range values", () => {
    const result = humanizeLeaf(
      { type: "uint256", name: "deadline" },
      1_767_225_600n,
    );
    expect(result?.kind).toBe("timestamp");
  });

  test("duration applies with a name hint", () => {
    const result = humanizeLeaf(
      { type: "uint256", name: "votingPeriod" },
      604_800n,
    );
    expect(result?.kind).toBe("duration");
    expect(result?.text).toBe("1 week = 604,800 seconds");
  });

  test("duration applies for known setter functions without a name hint", () => {
    const result = humanizeLeaf(
      { type: "uint256", name: "newValue", functionName: "updateDelay" },
      172_800n,
    );
    expect(result?.kind).toBe("duration");
  });

  test("amount-looking values never read as durations without a hint", () => {
    const result = humanizeLeaf(
      { type: "uint256", name: "amount" },
      315_360_000n,
    );
    expect(result?.kind).toBe("number");
  });
});
