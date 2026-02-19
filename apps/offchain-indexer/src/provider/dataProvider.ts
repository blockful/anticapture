import type { OffchainProposal, OffchainVote } from "@/repository/schema";
import type { DataProvider } from "@/provider/dataProvider.interface";

const PAGE_SIZE = 1000;

const PROPOSALS_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $pageSize: Int!) {
    proposals(
      where: { space: $spaceId, created_gt: $cursor }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      id
      author
      title
      body
      discussion
      type
      start
      end
      state
      created
      updated
      link
      flagged
    }
  }
`;

const VOTES_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $pageSize: Int!) {
    votes(
      where: { space: $spaceId, created_gt: $cursor }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      id
      voter
      proposal {
        id
      }
      choice
      vp
      reason
      created
    }
  }
`;

interface SnapshotGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

interface RawProposal {
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

interface RawVote {
  id: string;
  voter: string;
  proposal: { id: string };
  choice: unknown;
  vp: number;
  reason: string;
  created: number;
}

export class SnapshotProvider implements DataProvider {
  constructor(
    private readonly endpoint: string,
    private readonly spaceId: string,
    private readonly apiKey?: string,
  ) {}

  async fetchProposals(cursor: string | null): Promise<{ data: OffchainProposal[]; nextCursor: string | null }> {
    const cursorInt = cursor ? parseInt(cursor, 10) : 0;

    const response = await this.query<{ proposals: RawProposal[] }>(
      PROPOSALS_QUERY,
      { spaceId: this.spaceId, cursor: cursorInt, pageSize: PAGE_SIZE },
    );

    const proposals: OffchainProposal[] = response.proposals.map((p) => ({
      id: p.id,
      spaceId: this.spaceId,
      author: p.author,
      title: p.title,
      body: p.body ?? "",
      discussion: p.discussion ?? "",
      type: p.type ?? "single-choice",
      start: p.start,
      end: p.end,
      state: p.state ?? "closed",
      created: p.created,
      updated: p.updated ?? p.created,
      link: p.link ?? "",
      flagged: p.flagged ?? false,
    }));

    const nextCursor =
      proposals.length >= PAGE_SIZE
        ? String(proposals[proposals.length - 1]!.created)
        : null;

    return { data: proposals, nextCursor };
  }

  async fetchVotes(cursor: string | null): Promise<{ data: OffchainVote[]; nextCursor: string | null }> {
    const cursorInt = cursor ? parseInt(cursor, 10) : 0;

    const response = await this.query<{ votes: RawVote[] }>(
      VOTES_QUERY,
      { spaceId: this.spaceId, cursor: cursorInt, pageSize: PAGE_SIZE },
    );

    const votes: OffchainVote[] = response.votes.map((v) => ({
      id: v.id,
      spaceId: this.spaceId,
      voter: v.voter,
      proposalId: v.proposal.id,
      choice: v.choice,
      vp: v.vp ?? 0,
      reason: v.reason ?? "",
      created: v.created,
    }));

    const nextCursor =
      votes.length >= PAGE_SIZE
        ? String(votes[votes.length - 1]!.created)
        : null;

    return { data: votes, nextCursor };
  }

  private async query<T>(
    queryString: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: queryString, variables }),
    });

    if (!res.ok) {
      throw new Error(`Snapshot API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as SnapshotGraphQLResponse<T>;

    if (json.errors?.length) {
      throw new Error(
        `Snapshot GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`,
      );
    }

    if (!json.data) {
      throw new Error("Snapshot API returned no data");
    }

    return json.data;
  }
}
