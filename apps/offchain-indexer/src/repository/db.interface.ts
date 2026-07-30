import type { OffchainProposal, OffchainVote } from "@/repository/schema";

export interface Repository {
  getLastCursor(entity: string): Promise<string | null>;
  resetCursor(entity: string): Promise<void>;
  clearProposals(): Promise<void>;
  clearVotes(): Promise<void>;
  getProposalMetadataBackfillBatch(
    cursor: string | null,
    limit: number,
  ): Promise<{ ids: string[]; nextCursor: string | null }>;
  getProposalIdsSince(since: number): Promise<string[]>;
  deleteProposals(ids: string[]): Promise<void>;
  saveProposals(proposals: OffchainProposal[], cursor: string): Promise<void>;
  saveProposalMetadataBackfill(
    proposals: OffchainProposal[],
    cursor: string,
  ): Promise<void>;
  saveVotes(votes: OffchainVote[], cursor: string): Promise<void>;
  /**
   * Proposals whose voting ended between `endedSince` and `now` and whose tally
   * is still all zeros — the signature of a Shutter proposal awaiting (or
   * missing) its reveal. Windowed on `end` rather than `created` so a proposal
   * that ran for longer than the window is still picked up once it closes.
   */
  getRevealPendingProposalIds(
    endedSince: number,
    now: number,
  ): Promise<string[]>;
  /** Upserts without touching the sync cursor, for out-of-band re-reads. */
  upsertProposals(proposals: OffchainProposal[]): Promise<void>;
  upsertVotes(votes: OffchainVote[]): Promise<void>;
}
