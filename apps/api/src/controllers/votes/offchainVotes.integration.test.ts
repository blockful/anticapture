import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, it, expect, beforeEach } from "vitest";

import { DBOffchainVote } from "@/mappers";
import { OffchainVotesService } from "@/services/votes/offchainVotes";

import { offchainVotes } from "./offchainVotes";

type VoteWithTitle = DBOffchainVote & { proposalTitle: string | null };

class FakeOffchainVotesRepository {
  private votes: VoteWithTitle[] = [];
  private count = 0;

  setData(votes: VoteWithTitle[], totalCount?: number) {
    this.votes = votes;
    this.count = totalCount ?? votes.length;
  }

  async getVotes(): Promise<{ items: VoteWithTitle[]; totalCount: number }> {
    return { items: this.votes, totalCount: this.count };
  }

  async getVotesByProposalId(
    proposalId: string,
  ): Promise<{ items: VoteWithTitle[]; totalCount: number }> {
    const filtered = this.votes.filter((v) => v.proposalId === proposalId);
    return { items: filtered, totalCount: filtered.length };
  }
}

const createMockVote = (
  overrides: Partial<VoteWithTitle> = {},
): VoteWithTitle => ({
  spaceId: "ens.eth",
  voter: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  proposalId: "proposal-1",
  choice: { "1": 1 },
  vp: "100",
  reason: "",
  created: 1700000000,
  proposalTitle: "Test Proposal",
  ...overrides,
});

function createTestApp(service: OffchainVotesService) {
  const app = new Hono();
  offchainVotes(app, service);
  return app;
}

describe("Offchain Votes Controller - Integration Tests", () => {
  let fakeRepo: FakeOffchainVotesRepository;
  let service: OffchainVotesService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeOffchainVotesRepository();
    service = new OffchainVotesService(fakeRepo);
    app = createTestApp(service);
  });

  describe("GET /offchain/votes", () => {
    it("should return 200 with correct response shape", async () => {
      const vote = createMockVote();
      fakeRepo.setData([vote]);

      const res = await app.request("/offchain/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            voter: vote.voter,
            proposalId: vote.proposalId,
            choice: vote.choice,
            vp: Number(vote.vp),
            reason: vote.reason,
            created: vote.created,
            proposalTitle: vote.proposalTitle,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items when no data", async () => {
      fakeRepo.setData([]);

      const res = await app.request("/offchain/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept all query params", async () => {
      fakeRepo.setData([createMockVote()]);
      const voter = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

      const res = await app.request(
        `/offchain/votes?skip=0&limit=5&orderBy=votingPower&orderDirection=asc&voterAddresses=${voter}&fromDate=1000&toDate=5000`,
      );

      expect(res.status).toBe(200);
    });
  });

  describe("GET /offchain/proposals/{id}/votes", () => {
    it("should return 200 with votes for given proposal", async () => {
      fakeRepo.setData([
        createMockVote({ proposalId: "p-1" }),
        createMockVote({
          proposalId: "p-2",
          voter: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        }),
      ]);

      const res = await app.request("/offchain/proposals/p-1/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].proposalId).toBe("p-1");
    });

    it("should return 200 with empty items when no votes", async () => {
      fakeRepo.setData([]);

      const res = await app.request("/offchain/proposals/nonexistent/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });
  });
});
