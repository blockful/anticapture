import type { OffchainProposal, OffchainVote } from "@/repository/schema";

export interface Repository {
  getLastCursor(entity: string): Promise<string | null>;
  resetCursor(entity: string): Promise<void>;
  saveProposals(proposals: OffchainProposal[], cursor: string): Promise<void>;
  saveVotes(votes: OffchainVote[], cursor: string): Promise<void>;
}
