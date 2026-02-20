import type { OffchainVote } from "@/repository/schema";

export interface RawVote {
  id: string;
  voter: string;
  proposal: { id: string };
  choice: unknown;
  vp: number;
  reason: string;
  created: number;
}

export const toOffchainVote = (
  raw: RawVote,
  spaceId: string,
): OffchainVote => ({
  id: raw.id,
  spaceId,
  voter: raw.voter,
  proposalId: raw.proposal.id,
  choice: raw.choice,
  vp: raw.vp ?? 0,
  reason: raw.reason ?? "",
  created: raw.created,
});
