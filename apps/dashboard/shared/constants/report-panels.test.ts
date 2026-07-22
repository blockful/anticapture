import { getReportPanels, getReportSection } from "./report-panels";

describe("report panel routing", () => {
  it.each([
    ["/ens/proposals/123", "proposals"],
    ["/ens/proposals/new", "proposals"],
    ["/whitelabel/ens/delegates/0x123", "holders-and-delegates"],
    ["/whitelabel/ens/governance-settings", "governance"],
  ])("maps %s to its parent section", (pathname, expectedSection) => {
    expect(getReportSection(pathname)).toBe(expectedSection);
  });

  it("uses overview options only when no reportable section exists", () => {
    expect(getReportPanels(getReportSection("/ens"))).toEqual([
      "Overview metrics",
      "Resilience stages",
      "Attack exposure",
    ]);
  });
});
