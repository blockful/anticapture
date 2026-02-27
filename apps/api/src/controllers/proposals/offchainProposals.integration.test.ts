import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { describe, it, expect, beforeEach } from "vitest";

import { DBOffchainProposal } from "@/mappers";
import { OffchainProposalsService } from "@/services/proposals/offchainProposals";

import { offchainProposals } from "./offchainProposals";

class FakeOffchainProposalsRepository {
  private proposals: DBOffchainProposal[] = [];
  private count = 0;

  setData(proposals: DBOffchainProposal[], totalCount?: number) {
    this.proposals = proposals;
    this.count = totalCount ?? proposals.length;
  }

  async getProposals(): Promise<DBOffchainProposal[]> {
    return this.proposals;
  }

  async getProposalsCount(): Promise<number> {
    return this.count;
  }

  async getProposalById(
    proposalId: string,
  ): Promise<DBOffchainProposal | undefined> {
    return this.proposals.find((p) => p.id === proposalId);
  }
}

const createMockProposal = (
  overrides: Partial<DBOffchainProposal> = {},
): DBOffchainProposal => ({
  id: "proposal-1",
  spaceId: "ens.eth",
  author: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Test Proposal",
  body: "Test body",
  discussion: "",
  type: "single-choice",
  start: 1700000000,
  end: 1700086400,
  state: "active",
  created: 1700000000,
  updated: 1700000000,
  link: "",
  flagged: false,
  ...overrides,
});

function createTestApp(service: OffchainProposalsService) {
  const app = new Hono();
  offchainProposals(app, service);
  return app;
}

describe("Offchain Proposals Controller - Integration Tests", () => {
  let fakeRepo: FakeOffchainProposalsRepository;
  let service: OffchainProposalsService;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    fakeRepo = new FakeOffchainProposalsRepository();
    service = new OffchainProposalsService(fakeRepo);
    app = createTestApp(service);
  });

  describe("GET /offchain/proposals", () => {
    it("should return 200 with correct response shape", async () => {
      const proposal = createMockProposal();
      fakeRepo.setData([proposal]);

      const res = await app.request("/offchain/proposals");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [proposal],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items when no data", async () => {
      fakeRepo.setData([]);

      const res = await app.request("/offchain/proposals");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept query params: skip, limit, orderDirection, status, fromDate", async () => {
      fakeRepo.setData([createMockProposal()]);

      const res = await app.request(
        "/offchain/proposals?skip=0&limit=5&orderDirection=asc&status=active&fromDate=1700000000",
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 for invalid parameter", async () => {
      const res = await app.request("/offchain/proposals?skip=-1");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /offchain/proposals/{id}", () => {
    it("should return 200 with single proposal when found", async () => {
      const proposal = createMockProposal({ id: "find-me" });
      fakeRepo.setData([proposal]);

      const res = await app.request("/offchain/proposals/find-me");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("find-me");
      expect(body.title).toBe("Test Proposal");
    });

    it("should return 404 when proposal not found", async () => {
      fakeRepo.setData([]);

      const res = await app.request("/offchain/proposals/nonexistent");

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Proposal not found" });
    });
  });
});
