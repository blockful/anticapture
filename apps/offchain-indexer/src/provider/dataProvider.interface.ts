import type { OffchainProposal, OffchainVote } from "@/repository/schema";

export interface DataProvider {
  fetchProposals(cursor: string | null): Promise<{ data: OffchainProposal[], nextCursor: string | null }>;
  fetchVotes(cursor: string | null): Promise<{ data: OffchainVote[], nextCursor: string | null }>;
}
