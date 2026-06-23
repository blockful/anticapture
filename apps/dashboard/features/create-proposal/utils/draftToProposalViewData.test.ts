import { draftToProposalViewData } from "./draftToProposalViewData";
import type { ProposalDraft } from "@/features/create-proposal/types";

const draft: ProposalDraft = {
  id: "draft-1",
  daoId: "ens",
  author: "0xAUTHOR",
  title: "My Draft Title",
  discussionUrl: "https://discuss.example/123",
  body: "## Abstract\nDoes a thing.",
  createdAt: 1000,
  updatedAt: 2000,
  actions: [],
};

describe("draftToProposalViewData", () => {
  it("maps draft content with zeroed votes and null timestamps", () => {
    const result = draftToProposalViewData(draft, {
      targets: [],
      values: [],
      calldatas: [],
    });

    expect(result.id).toBe("draft-1");
    expect(result.daoId).toBe("ens");
    expect(result.title).toBe("My Draft Title");
    expect(result.proposerAccountId).toBe("0xAUTHOR");
    // Body becomes the markdown description; title lives in the sidebar.
    expect(result.description).toBe("## Abstract\nDoes a thing.");
    expect(result.forVotes).toBe("0");
    expect(result.againstVotes).toBe("0");
    expect(result.abstainVotes).toBe("0");
    expect(result.quorum).toBe("0");
    expect(result.startTimestamp).toBe(0);
    expect(result.endTimestamp).toBe(0);
    expect(result.queuedTimestamp).toBeNull();
    expect(result.executedTimestamp).toBeNull();
  });

  it("passes encoded actions through to targets/values/calldatas", () => {
    const result = draftToProposalViewData(draft, {
      targets: ["0xTARGET"],
      values: ["0"],
      calldatas: ["0xdeadbeef"],
    });

    expect(result.targets).toEqual(["0xTARGET"]);
    expect(result.values).toEqual(["0"]);
    expect(result.calldatas).toEqual(["0xdeadbeef"]);
  });
});
