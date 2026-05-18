import type { OnchainProposal } from "@anticapture/client";

import { ProposalState, ProposalStatus } from "@/features/governance/types";
import { transformToGovernanceProposal } from "@/features/governance/utils/transformToGovernanceProposal";

describe("transformToGovernanceProposal", () => {
  it("transforms Kubb onchain proposals into governance list proposals", () => {
    const proposal: OnchainProposal = {
      id: "42",
      daoId: "UNI",
      txHash: "0xproposal",
      proposerAccountId: "0x0000000000000000000000000000000000000001",
      title: "Upgrade executor",
      description: "Proposal body",
      startBlock: 100,
      endBlock: 200,
      timestamp: 1_700_000_000,
      status: "ACTIVE",
      forVotes: 1200000000000000000n,
      againstVotes: 300000000000000000n,
      abstainVotes: 500000000000000000n,
      startTimestamp: 1_700_000_100,
      endTimestamp: 1_700_086_500,
      queuedTimestamp: null,
      executedTimestamp: null,
      queuedTxHash: null,
      executedTxHash: null,
      quorum: 1000000000000000000n,
      calldatas: ["0x"],
      targets: ["0x0000000000000000000000000000000000000002"],
      values: [0n],
      proposalType: null,
    };

    const result = transformToGovernanceProposal(proposal, 18);

    expect(result.id).toBe("42");
    expect(result.status).toBe(ProposalStatus.ONGOING);
    expect(result.state).toBe(ProposalState.ACTIVE);
    expect(result.proposer).toBe(proposal.proposerAccountId);
    expect(result.votes).toMatchObject({
      for: "1.20",
      against: "0.30",
      total: "2.00",
      forPercentage: "60",
      againstPercentage: "15",
    });
    expect(result.quorum).toBe("1.00");
    expect(result.values).toEqual(["0"]);
    expect(result.targets).toEqual([
      "0x0000000000000000000000000000000000000002",
    ]);
  });
});
