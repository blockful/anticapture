import type { OffchainProposal } from "@/repository/schema";

export interface RawProposal {
  id: string;
  author: string;
  title: string;
  body: string;
  discussion: string;
  type: string;
  start: number;
  end: number;
  state: string;
  created: number;
  updated: number;
  link: string;
  flagged: boolean;
}

export const toOffchainProposal = (
  raw: RawProposal,
  spaceId: string,
): OffchainProposal => ({
  id: raw.id,
  spaceId,
  author: raw.author,
  title: raw.title,
  body: raw.body ?? "",
  discussion: raw.discussion ?? "",
  type: raw.type ?? "single-choice",
  start: raw.start,
  end: raw.end,
  state: raw.state ?? "closed",
  created: raw.created,
  updated: raw.updated ?? raw.created,
  link: raw.link ?? "",
  flagged: raw.flagged ?? false,
});
