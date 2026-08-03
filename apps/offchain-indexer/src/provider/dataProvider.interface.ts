import type { OffchainProposal, OffchainVote } from "@/repository/schema";

export interface DataProvider {
  fetchProposals(
    cursor: string | null,
  ): Promise<{ data: OffchainProposal[]; nextCursor: string | null }>;
  fetchProposalIdsSince(since: number): Promise<string[]>;
  fetchVotes(
    cursor: string | null,
  ): Promise<{ data: OffchainVote[]; nextCursor: string | null }>;
  /** Re-reads specific proposals, ignoring the forward-only cursor. */
  fetchProposalsByIds(ids: string[]): Promise<OffchainProposal[]>;
  /** Re-reads every vote on the given proposals, ignoring the cursor. */
  fetchVotesByProposalIds(ids: string[]): Promise<OffchainVote[]>;
}
