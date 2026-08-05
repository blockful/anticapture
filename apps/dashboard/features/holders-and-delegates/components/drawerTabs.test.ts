import { getRenderableDrawerTab } from "./drawerTabs";

describe("getRenderableDrawerTab", () => {
  const tabs = [
    { id: "delegationHistory", label: "Delegation History" },
    { id: "topInteractions", label: "Top Interactions" },
  ];

  it("returns the active tab when it exists", () => {
    expect(getRenderableDrawerTab(tabs, "topInteractions").label).toBe(
      "Top Interactions",
    );
  });

  it("returns the rendered fallback tab when the active tab is unavailable", () => {
    expect(getRenderableDrawerTab(tabs, "votes").label).toBe(
      "Delegation History",
    );
  });
});
