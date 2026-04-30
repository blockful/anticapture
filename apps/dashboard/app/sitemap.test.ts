import { getProposalSitemapRoute } from "@/app/sitemap";

describe("getProposalSitemapRoute", () => {
  test("uses canonical proposal URLs for onchain proposals", () => {
    expect(getProposalSitemapRoute("ens", { id: "123", kind: "onchain" })).toBe(
      "/ens/proposals/123",
    );
  });

  test("uses canonical governance URLs for offchain proposals", () => {
    expect(
      getProposalSitemapRoute("ens", {
        id: "snapshot proposal/id",
        kind: "offchain",
      }),
    ).toBe("/ens/governance/offchain-proposal/snapshot%20proposal%2Fid");
  });
});
