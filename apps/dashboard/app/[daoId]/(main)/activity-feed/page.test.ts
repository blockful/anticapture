import ActivityFeedPage from "./page";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/features/feed", () => ({
  ActivityFeedSection: () => null,
}));

describe("ActivityFeedPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Tornado activity feed when enabled in DAO config", async () => {
    const result = await ActivityFeedPage({
      params: Promise.resolve({ daoId: "torn" }),
    });

    expect(redirect).not.toHaveBeenCalled();
    // The page wraps the section in a fragment alongside the e2e-only
    // ForceErrorTrigger; the section is the second child.
    expect(result.props.children[1].props.feedDaoId).toBe("torn");
  });
});
