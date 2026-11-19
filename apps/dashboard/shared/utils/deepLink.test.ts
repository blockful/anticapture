import {
  buildDeepLinkUrl,
  deepLinkSelector,
  deepLinkTarget,
  isDeepLinkSlug,
  pickScrollBlock,
  slugFromHash,
} from "@/shared/utils/deepLink";

describe("isDeepLinkSlug", () => {
  it.each(["ensv2", "run-rate", "renewal-rate-by-year", "a1-b2"])(
    "accepts %s",
    (slug) => {
      expect(isDeepLinkSlug(slug)).toBe(true);
    },
  );

  it.each([
    "",
    "Run-Rate",
    "run_rate",
    "run--rate",
    "-run-rate",
    "run-rate-",
    "1-run",
    "run rate",
    'x"],[data-y="',
  ])("rejects %j", (slug) => {
    expect(isDeepLinkSlug(slug)).toBe(false);
  });
});

describe("slugFromHash", () => {
  it("reads the slug with or without the leading #", () => {
    expect(slugFromHash("#run-rate")).toBe("run-rate");
    expect(slugFromHash("run-rate")).toBe("run-rate");
  });

  it("returns null for an empty hash", () => {
    expect(slugFromHash("")).toBeNull();
    expect(slugFromHash("#")).toBeNull();
  });

  it("returns null for a hash that is not a slug", () => {
    expect(slugFromHash("#Run Rate")).toBeNull();
    expect(slugFromHash('#x"],[data-y="')).toBeNull();
    expect(slugFromHash("#run-rate?utm=1")).toBeNull();
  });
});

describe("deepLinkTarget and deepLinkSelector", () => {
  it("mark and find the same block", () => {
    expect(deepLinkTarget("run-rate")).toEqual({
      "data-deep-link": "run-rate",
    });
    expect(deepLinkSelector("run-rate")).toBe('[data-deep-link="run-rate"]');
  });
});

describe("buildDeepLinkUrl", () => {
  it("adds the slug as the hash", () => {
    expect(
      buildDeepLinkUrl("https://app.anticapture.com/ens/revenue", "run-rate"),
    ).toBe("https://app.anticapture.com/ens/revenue#run-rate");
  });

  it("keeps the query and replaces an existing hash", () => {
    expect(
      buildDeepLinkUrl(
        "https://app.anticapture.com/ens/revenue?ref=forum#ensv2",
        "run-rate",
      ),
    ).toBe("https://app.anticapture.com/ens/revenue?ref=forum#run-rate");
  });
});

describe("pickScrollBlock", () => {
  it("centres a block that fits comfortably", () => {
    expect(pickScrollBlock(340, 900)).toBe("center");
    expect(pickScrollBlock(540, 900)).toBe("center");
  });

  it("starts a tall block at the top", () => {
    expect(pickScrollBlock(541, 900)).toBe("start");
    expect(pickScrollBlock(1200, 900)).toBe("start");
  });
});
