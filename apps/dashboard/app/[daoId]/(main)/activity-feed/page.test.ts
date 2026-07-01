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
    expect(result.props.feedDaoId).toBe("torn");
  });
});
