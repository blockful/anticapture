import {
  type OffchainProposal,
  type OnchainProposal,
  offchainProposals,
  proposals,
} from "@anticapture/client";

import { getAllProposalPaths, getProposalSitemapRoute } from "@/app/sitemap";
import { DaoIdEnum } from "@/shared/types/daos";

jest.mock("@anticapture/client", () => ({
  offchainProposals: jest.fn(),
  proposals: jest.fn(),
}));

function buildOnchainProposal(id: string): OnchainProposal {
  return {
    abstainVotes: "0",
    againstVotes: "0",
    calldatas: [],
    daoId: "ENS",
    description: "",
    endBlock: 2,
    endTimestamp: 2,
    forVotes: "0",
    id,
    proposalType: null,
    proposerAccountId: "0x0000000000000000000000000000000000000000",
    quorum: "0",
    startBlock: 1,
    startTimestamp: 1,
    status: "ACTIVE",
    targets: [],
    timestamp: 1,
    title: `Proposal ${id}`,
    txHash: "0x0",
    values: [],
  };
}

function buildOffchainProposal(id: string): OffchainProposal {
  return {
    author: "0x0000000000000000000000000000000000000000",
    body: "",
    choices: [],
    created: 1,
    discussion: "",
    end: 2,
    flagged: false,
    id,
    link: "",
    network: "1",
    scores: [],
    snapshot: null,
    spaceId: "ens.eth",
    start: 1,
    state: "active",
    strategies: [],
    title: `Proposal ${id}`,
    type: "single-choice",
    updated: 1,
  };
}

function buildIds(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
}

const mockedProposals = jest.mocked(proposals);
const mockedOffchainProposals = jest.mocked(offchainProposals);

beforeEach(() => {
  mockedProposals.mockReset();
  mockedOffchainProposals.mockReset();
});

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

describe("getAllProposalPaths", () => {
  test("fetches every proposal page with the API maximum limit", async () => {
    const onchainIds = buildIds("onchain", 205);
    const offchainIds = buildIds("offchain", 101);

    mockedProposals.mockImplementation(async (_dao, params) => {
      const skip = params?.skip ?? 0;
      const limit = params?.limit ?? 100;

      return {
        items: onchainIds
          .slice(skip, skip + limit)
          .map((id) => buildOnchainProposal(id)),
        totalCount: onchainIds.length,
      };
    });

    mockedOffchainProposals.mockImplementation(async (_dao, params) => {
      const skip = params?.skip ?? 0;
      const limit = params?.limit ?? 100;

      return {
        items: offchainIds
          .slice(skip, skip + limit)
          .map((id) => buildOffchainProposal(id)),
        totalCount: offchainIds.length,
      };
    });

    const paths = await getAllProposalPaths(DaoIdEnum.ENS);

    expect(paths).toHaveLength(onchainIds.length + offchainIds.length);
    expect(paths.at(0)).toEqual({ id: "onchain-1", kind: "onchain" });
    expect(paths.at(-1)).toEqual({ id: "offchain-101", kind: "offchain" });
    expect(mockedProposals).toHaveBeenNthCalledWith(1, "ens", {
      limit: 100,
      skip: 0,
    });
    expect(mockedProposals).toHaveBeenNthCalledWith(2, "ens", {
      limit: 100,
      skip: 100,
    });
    expect(mockedProposals).toHaveBeenNthCalledWith(3, "ens", {
      limit: 100,
      skip: 200,
    });
    expect(mockedOffchainProposals).toHaveBeenNthCalledWith(1, "ens", {
      limit: 100,
      skip: 0,
    });
    expect(mockedOffchainProposals).toHaveBeenNthCalledWith(2, "ens", {
      limit: 100,
      skip: 100,
    });
  });
});
