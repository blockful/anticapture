import { describe, expect, it } from "vitest";

import { magicLinkLandingUrl } from "@/email/magic-link";

describe("magicLinkLandingUrl", () => {
  it("rewrites the verify endpoint into the interstitial page, keeping token and callbackURL", () => {
    const verify =
      "http://localhost:3000/api/auth/magic-link/verify?token=abc123&callbackURL=http%3A%2F%2Flocalhost%3A3000%2Fens%2Fproposals";

    expect(magicLinkLandingUrl(verify)).toBe(
      "http://localhost:3000/auth/magic-link?token=abc123&callbackURL=http%3A%2F%2Flocalhost%3A3000%2Fens%2Fproposals",
    );
  });

  it("stays on the origin that issued the link (per-host instances)", () => {
    const verify =
      "https://dev.anticapture.com/api/auth/magic-link/verify?token=t";

    expect(magicLinkLandingUrl(verify)).toBe(
      "https://dev.anticapture.com/auth/magic-link?token=t",
    );
  });
});
