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
    scores: [],
    scoresTotal: 0,
    quorum: 0,
    choices: [],
    network: "",
    snapshot: null,
    strategies: [],
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

function createSimpleRepository(options?: {
  revealPendingIds?: string[];
}): Repository & {
  cursors: Map<string, string | null>;
  savedProposals: OffchainProposal[];
  savedVotes: OffchainVote[];
  proposalIds: string[];
  upsertedProposals: OffchainProposal[];
  upsertedVotes: OffchainVote[];
  metadataBackfillIds: string[];
} {
  const cursors = new Map<string, string | null>();
  const savedProposals: OffchainProposal[] = [];
  const savedVotes: OffchainVote[] = [];
  const proposalIds: string[] = [];
  const upsertedProposals: OffchainProposal[] = [];
  const upsertedVotes: OffchainVote[] = [];
  const metadataBackfillIds: string[] = [];

  return {
    cursors,
    savedProposals,
    savedVotes,
    proposalIds,
    upsertedProposals,
    upsertedVotes,
    metadataBackfillIds,
    getRevealPendingProposalIds: vi.fn(
      async () => options?.revealPendingIds ?? [],
    ),
    upsertProposals: vi.fn(async (proposals: OffchainProposal[]) => {
      upsertedProposals.push(...proposals);
    }),
    upsertVotes: vi.fn(async (votes: OffchainVote[]) => {
      upsertedVotes.push(...votes);
    }),
    getLastCursor: vi.fn(async (entity: string) => cursors.get(entity) ?? null),
    resetCursor: vi.fn(async (entity: string) => {
      cursors.delete(entity);
    }),
    clearProposals: vi.fn(async () => {
      savedProposals.length = 0;
      metadataBackfillIds.length = 0;
    }),
    clearVotes: vi.fn(async () => {
      savedVotes.length = 0;
    }),
    getProposalIdsSince: vi.fn(async () => proposalIds),
    getProposalMetadataBackfillBatch: vi.fn(
      async (cursor: string | null, limit: number) => {
        const cursorId = cursor?.split(":")[1] ?? "";
        const cursorIndex = cursorId
          ? metadataBackfillIds.indexOf(cursorId) + 1
          : 0;
        const ids = metadataBackfillIds.slice(cursorIndex, cursorIndex + limit);
        const nextIndex = cursorIndex + ids.length - 1;
        const nextCreated = 1700000000 + nextIndex * 100;
        return {
          ids,
          nextCursor:
            ids.length > 0 ? `${nextCreated}:${ids[ids.length - 1]}` : null,
        };
      },
    ),
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
    saveProposalMetadataBackfill: vi.fn(
      async (proposals: OffchainProposal[], cursor: string) => {
        savedProposals.push(...proposals);
        cursors.set("proposal_metadata_backfill", cursor);
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
  proposalsById?: OffchainProposal[];
  failProposals?: boolean;
  failProposalsById?: boolean;
  failProposalIds?: boolean;
  failVotes?: boolean;
  revealedProposals?: OffchainProposal[];
  revealedVotes?: OffchainVote[];
}): DataProvider {
  return {
    fetchVotesByProposalIds: vi.fn(async () => options?.revealedVotes ?? []),
    fetchProposals: vi.fn(async () => {
      if (options?.failProposals) throw new Error("Proposals fetch failed");
      return {
        data: options?.proposals ?? [],
        nextCursor: options?.proposalsNextCursor ?? null,
      };
    }),
    fetchProposalIdsSince: vi.fn(async () => {
      if (options?.failProposalIds) {
        throw new Error("Proposal id fetch failed");
      }
      return options?.proposalIds ?? ["p-1"];
    }),
    // Backs both the metadata backfill (proposalsById) and the reveal re-read
    // (revealedProposals); each test exercises one of the two.
    fetchProposalsByIds: vi.fn(async () => {
      if (options?.failProposalsById) {
        throw new Error("Proposal metadata fetch failed");
      }
      return options?.proposalsById ?? options?.revealedProposals ?? [];
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
    expect(repo.getLastCursor).toHaveBeenCalledWith(
      "proposal_metadata_backfill",
    );
    expect(provider.fetchProposals).toHaveBeenCalledWith("1700000000");
    expect(provider.fetchProposalIdsSince).toHaveBeenCalled();
    expect(provider.fetchVotes).toHaveBeenCalledWith("1700000050");

    void promise;
  });

  it("should backfill existing proposal metadata without resetting proposal or vote cursors", async () => {
    const repo = createSimpleRepository();
    repo.cursors.set("proposals", "1700000000");
    repo.cursors.set("votes", "1700000050");
    repo.metadataBackfillIds.push("p-old");
    const hydratedProposal = makeProposal({
      id: "p-old",
      scores: [5_347_713.99, 0, 1_813.59],
      scoresTotal: 5_349_527,
      quorum: 10_000_000,
    });
    const provider = createSimpleProvider({
      proposalsById: [hydratedProposal],
    });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.fetchProposals).toHaveBeenCalledWith("1700000000");
    expect(provider.fetchVotes).toHaveBeenCalledWith("1700000050");
    expect(provider.fetchProposalsByIds).toHaveBeenCalledWith(["p-old"]);
    expect(repo.saveProposalMetadataBackfill).toHaveBeenCalledWith(
      [hydratedProposal],
      "1700000000:p-old",
    );
    expect(repo.cursors.get("proposals")).toBe("1700000000");
    expect(repo.cursors.get("votes")).toBe("1700000050");
    expect(repo.cursors.get("proposal_metadata_backfill")).toBe(
      "1700000000:p-old",
    );

    void promise;
  });

  it("should delete missing Snapshot proposals and advance metadata backfill cursor", async () => {
    const repo = createSimpleRepository();
    repo.proposalIds.push("p-old", "p-missing", "p-newer");
    repo.metadataBackfillIds.push("p-old", "p-missing", "p-newer");
    const oldProposal = makeProposal({
      id: "p-old",
      created: 1700000000,
      scores: [5_347_713.99, 0, 1_813.59],
      scoresTotal: 5_349_527,
      quorum: 10_000_000,
    });
    const newerProposal = makeProposal({
      id: "p-newer",
      created: 1700000100,
      scores: [10_000_001, 0],
      scoresTotal: 10_000_001,
      quorum: 10_000_000,
    });
    const provider = createSimpleProvider({
      proposalIds: ["p-old", "p-missing", "p-newer"],
      proposalsById: [oldProposal, newerProposal],
    });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.fetchProposalsByIds).toHaveBeenCalledWith([
      "p-old",
      "p-missing",
      "p-newer",
    ]);
    expect(repo.saveProposalMetadataBackfill).toHaveBeenCalledWith(
      [oldProposal, newerProposal],
      "1700000200:p-newer",
    );
    expect(repo.deleteProposals).toHaveBeenCalledWith(["p-missing"]);
    expect(repo.proposalIds).toStrictEqual(["p-old", "p-newer"]);
    expect(repo.cursors.get("proposal_metadata_backfill")).toBe(
      "1700000200:p-newer",
    );

    void promise;
  });

  it("should delete all-missing Snapshot proposals and advance metadata backfill cursor", async () => {
    const repo = createSimpleRepository();
    repo.cursors.set("proposal_metadata_backfill", "1700000000:p-old");
    repo.proposalIds.push("p-missing");
    repo.metadataBackfillIds.push("p-missing");
    const provider = createSimpleProvider({ proposalsById: [] });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.fetchProposalsByIds).toHaveBeenCalledWith(["p-missing"]);
    expect(repo.deleteProposals).toHaveBeenCalledWith(["p-missing"]);
    expect(repo.saveProposalMetadataBackfill).toHaveBeenCalledWith(
      [],
      "1700000000:p-missing",
    );
    expect(repo.proposalIds).toStrictEqual([]);
    expect(repo.cursors.get("proposal_metadata_backfill")).toBe(
      "1700000000:p-missing",
    );

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
    expect(provider.fetchProposalIdsSince).toHaveBeenCalled();
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

  it("re-reads a reveal-pending proposal and its votes without moving cursors", async () => {
    const repo = createSimpleRepository({ revealPendingIds: ["p-shutter"] });
    const revealed = makeProposal({
      id: "p-shutter",
      state: "closed",
      scores: [400, 100],
    });
    const revealedVotes = [
      makeVote({ proposalId: "p-shutter", voter: "0xaaa" }),
    ];
    const provider = createSimpleProvider({
      revealedProposals: [revealed],
      revealedVotes,
    });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.fetchProposalsByIds).toHaveBeenCalledWith(["p-shutter"]);
    expect(provider.fetchVotesByProposalIds).toHaveBeenCalledWith([
      "p-shutter",
    ]);
    // The revealed tally replaces the zeros, and this out-of-band re-read must
    // not advance either sync cursor.
    expect(repo.upsertedProposals).toEqual([revealed]);
    expect(repo.upsertedVotes).toEqual(revealedVotes);
    expect(repo.cursors.get("votes")).toBeUndefined();

    void promise;
  });

  it("keeps the reveal retryable when the vote write fails", async () => {
    const repo = createSimpleRepository({ revealPendingIds: ["p-shutter"] });
    repo.upsertVotes = vi.fn(async () => {
      throw new Error("vote batch too large");
    });
    const provider = createSimpleProvider({
      revealedProposals: [
        makeProposal({ id: "p-shutter", state: "closed", scores: [400, 100] }),
      ],
      revealedVotes: [makeVote({ proposalId: "p-shutter", voter: "0xaaa" })],
    });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    // Persisting the revealed tally is what drops the proposal out of
    // getRevealPendingProposalIds, so it must not land while the votes are
    // missing — otherwise the next pass never re-reads the encrypted choices.
    expect(repo.upsertedProposals).toEqual([]);

    void promise;
  });

  it("skips the reveal re-read when no proposal has a zero tally", async () => {
    const repo = createSimpleRepository({ revealPendingIds: [] });
    const provider = createSimpleProvider();
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.fetchProposalsByIds).not.toHaveBeenCalled();
    expect(provider.fetchVotesByProposalIds).not.toHaveBeenCalled();

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

  it("should reconcile only within the last two weeks", async () => {
    vi.setSystemTime(1_700_000_000_000);
    const expectedSince = 1_700_000_000 - 14 * 24 * 60 * 60;
    const repo = createSimpleRepository();
    const provider = createSimpleProvider({ proposalIds: ["p-1"] });
    const indexer = new Indexer(repo, provider, 60_000);

    const promise = indexer.start(false);
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.fetchProposalIdsSince).toHaveBeenCalledWith(expectedSince);
    expect(repo.getProposalIdsSince).toHaveBeenCalledWith(expectedSince);

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

    expect(repo.getProposalIdsSince).not.toHaveBeenCalled();
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
