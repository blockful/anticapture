import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Indexer } from "@/indexer";
import { logger } from "@/logger";
import type { DataProvider } from "@/provider/dataProvider.interface";
import type { Repository } from "@/repository/db.interface";
import type { OffchainProposal, OffchainVote } from "@/repository/schema";

function makeProposal(overrides?: Partial<OffchainProposal>): OffchainProposal {
  return {
    id: "p-1",
    spaceId: "ens.eth",
    author: "0xabc",
    title: "Test",
    body: "",
    discussion: "",
    type: "single-choice",
    start: 1700000000,
    end: 1700100000,
    state: "closed",
    created: 1700000000,
    updated: 1700000000,
    link: "",
    flagged: false,
    ...overrides,
  };
}

function makeVote(overrides?: Partial<OffchainVote>): OffchainVote {
  return {
    spaceId: "ens.eth",
    voter: "0xdef",
    proposalId: "p-1",
    choice: 1,
    vp: "100",
    reason: "",
    created: 1700000050,
    ...overrides,
  };
}

function createSimpleRepository(): Repository & {
  cursors: Map<string, string | null>;
  savedProposals: OffchainProposal[];
  savedVotes: OffchainVote[];
  proposalIds: string[];
} {
  const cursors = new Map<string, string | null>();
  const savedProposals: OffchainProposal[] = [];
  const savedVotes: OffchainVote[] = [];
  const proposalIds: string[] = [];

  return {
    cursors,
    savedProposals,
    savedVotes,
    proposalIds,
    getLastCursor: vi.fn(async (entity: string) => cursors.get(entity) ?? null),
    resetCursor: vi.fn(async (entity: string) => {
      cursors.delete(entity);
    }),
    clearProposals: vi.fn(async () => {
      savedProposals.length = 0;
    }),
    clearVotes: vi.fn(async () => {
      savedVotes.length = 0;
    }),
    getAllProposalIds: vi.fn(async () => proposalIds),
    deleteProposals: vi.fn(async (ids: string[]) => {
      for (const id of ids) {
        const index = proposalIds.indexOf(id);
        if (index !== -1) proposalIds.splice(index, 1);
      }
    }),
    saveProposals: vi.fn(
      async (proposals: OffchainProposal[], cursor: string) => {
        savedProposals.push(...proposals);
        cursors.set("proposals", cursor);
      },
    ),
    saveVotes: vi.fn(async (votes: OffchainVote[], cursor: string) => {
      savedVotes.push(...votes);
      cursors.set("votes", cursor);
    }),
  };
}

function createSimpleProvider(options?: {
  proposals?: OffchainProposal[];
  proposalIds?: string[];
  votes?: OffchainVote[];
  proposalsNextCursor?: string | null;
  votesNextCursor?: string | null;
  failProposals?: boolean;
  failProposalIds?: boolean;
  failVotes?: boolean;
}): DataProvider {
  return {
    fetchProposals: vi.fn(async () => {
      if (options?.failProposals) throw new Error("Proposals fetch failed");
      return {
        data: options?.proposals ?? [],
        nextCursor: options?.proposalsNextCursor ?? null,
      };
    }),
    fetchAllProposalIds: vi.fn(async () => {
      if (options?.failProposalIds) {
        throw new Error("Proposal id fetch failed");
      }
      return options?.proposalIds ?? ["p-1"];
    }),
    fetchVotes: vi.fn(async () => {
      if (options?.failVotes) throw new Error("Votes fetch failed");
      return {
        data: options?.votes ?? [],
        nextCursor: options?.votesNextCursor ?? null,
      };
    }),
  };
}

describe("Indexer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should load cursors from repository on start", async () => {
    const repo = createSimpleRepository();
    repo.cursors.set("proposals", "1700000000");
    repo.cursors.set("votes", "1700000050");
    const provider = createSimpleProvider();
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.getLastCursor).toHaveBeenCalledWith("proposals");
    expect(repo.getLastCursor).toHaveBeenCalledWith("votes");
    expect(provider.fetchProposals).toHaveBeenCalledWith("1700000000");
    expect(provider.fetchAllProposalIds).toHaveBeenCalled();
    expect(provider.fetchVotes).toHaveBeenCalledWith("1700000050");

    void promise;
  });

  it("should reset cursors when forceBackfill is true", async () => {
    const repo = createSimpleRepository();
    repo.cursors.set("proposals", "1700000000");
    repo.cursors.set("votes", "1700000050");
    const provider = createSimpleProvider();
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(true);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.clearVotes).toHaveBeenCalled();
    expect(repo.clearProposals).toHaveBeenCalled();
    expect(repo.resetCursor).toHaveBeenCalledWith("proposals");
    expect(repo.resetCursor).toHaveBeenCalledWith("votes");
    expect(provider.fetchProposals).toHaveBeenCalledWith(null);
    expect(provider.fetchAllProposalIds).toHaveBeenCalled();
    expect(provider.fetchVotes).toHaveBeenCalledWith(null);

    void promise;
  });

  it("should advance cursor to last proposal when all are closed", async () => {
    const repo = createSimpleRepository();
    const proposals = [
      makeProposal({ id: "p-1", created: 1700000100, state: "closed" }),
      makeProposal({ id: "p-2", created: 1700000200, state: "closed" }),
    ];
    const provider = createSimpleProvider({ proposals });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.saveProposals).toHaveBeenCalledWith(proposals, "1700000200");

    void promise;
  });

  it("should stall cursor before first active proposal", async () => {
    const repo = createSimpleRepository();
    const proposals = [
      makeProposal({ id: "p-1", created: 1700000100, state: "closed" }),
      makeProposal({ id: "p-2", created: 1700000200, state: "active" }),
      makeProposal({ id: "p-3", created: 1700000300, state: "closed" }),
    ];
    const provider = createSimpleProvider({ proposals });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.saveProposals).toHaveBeenCalledWith(proposals, "1700000100");

    void promise;
  });

  it("should not advance cursor when first proposal is active", async () => {
    const repo = createSimpleRepository();
    const proposals = [
      makeProposal({ id: "p-1", created: 1700000100, state: "active" }),
      makeProposal({ id: "p-2", created: 1700000200, state: "closed" }),
    ];
    const provider = createSimpleProvider({ proposals });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.saveProposals).toHaveBeenCalledWith(proposals, "0");

    void promise;
  });

  it("should save fetched votes and update cursor", async () => {
    const repo = createSimpleRepository();
    const votes = [makeVote({ created: 1700000200 })];
    const provider = createSimpleProvider({ votes, votesNextCursor: null });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.savedVotes).toHaveLength(1);
    expect(repo.saveVotes).toHaveBeenCalledWith(votes, "1700000200");

    void promise;
  });

  it("should delete DB-only proposals during reconciliation", async () => {
    const repo = createSimpleRepository();
    repo.proposalIds.push("p-1", "p-deleted", "p-2");
    const provider = createSimpleProvider({ proposalIds: ["p-1", "p-2"] });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.deleteProposals).toHaveBeenCalledWith(["p-deleted"]);
    expect(repo.proposalIds).toStrictEqual(["p-1", "p-2"]);

    void promise;
  });

  it("should not delete proposals when all DB ids still exist", async () => {
    const repo = createSimpleRepository();
    repo.proposalIds.push("p-1", "p-2");
    const provider = createSimpleProvider({ proposalIds: ["p-1", "p-2"] });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.deleteProposals).not.toHaveBeenCalled();

    void promise;
  });

  it("should skip reconciliation when Snapshot returns no proposal ids", async () => {
    const repo = createSimpleRepository();
    repo.proposalIds.push("p-1");
    const provider = createSimpleProvider({ proposalIds: [] });
    const loggerSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger);
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.getAllProposalIds).not.toHaveBeenCalled();
    expect(repo.deleteProposals).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(
      "snapshot returned no proposals - skipping proposal reconciliation",
    );

    loggerSpy.mockRestore();
    void promise;
  });

  it("should continue syncing votes after reconciliation error", async () => {
    const repo = createSimpleRepository();
    const votes = [makeVote({ created: 1700000200 })];
    const provider = createSimpleProvider({
      failProposalIds: true,
      votes,
    });
    const loggerSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => logger);
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "error reconciling proposals - will retry",
    );
    expect(repo.saveVotes).toHaveBeenCalledWith(votes, "1700000200");

    loggerSpy.mockRestore();
    void promise;
  });

  it("should not save when provider returns empty data", async () => {
    const repo = createSimpleRepository();
    const provider = createSimpleProvider();
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.saveProposals).not.toHaveBeenCalled();
    expect(repo.saveVotes).not.toHaveBeenCalled();

    void promise;
  });

  it("should use nextCursor from provider for votes", async () => {
    const repo = createSimpleRepository();
    const votes = [makeVote({ created: 1700000100 })];
    const provider = createSimpleProvider({
      votes,
      votesNextCursor: "1700099999",
    });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(repo.saveVotes).toHaveBeenCalledWith(votes, "1700099999");

    void promise;
  });

  it("should continue polling after provider error", async () => {
    const repo = createSimpleRepository();
    const provider = createSimpleProvider({
      failProposals: true,
      failProposalIds: true,
      failVotes: true,
    });
    const indexer = new Indexer(repo, provider, 1_000);
    const loggerSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => logger);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: null }),
      "error syncing proposals - will retry",
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: null }),
      "error syncing votes - will retry",
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "error reconciling proposals - will retry",
    );

    // Verify the loop continues — second tick fires after interval
    await vi.advanceTimersByTimeAsync(1_000);
    expect(provider.fetchProposals).toHaveBeenCalledTimes(2);

    loggerSpy.mockRestore();
    void promise;
  });

  it("should poll at the configured interval", async () => {
    const repo = createSimpleRepository();
    const provider = createSimpleProvider();
    const indexer = new Indexer(repo, provider, 5_000);

    const promise = indexer.start(false);

    await vi.advanceTimersByTimeAsync(0);
    expect(provider.fetchProposals).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(provider.fetchProposals).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(provider.fetchProposals).toHaveBeenCalledTimes(3);

    void promise;
  });
});
