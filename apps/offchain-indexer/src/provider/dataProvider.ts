import { type AxiosInstance } from "axios";
import { z } from "zod";

import { rawProposalSchema, offchainProposalSchema } from "@/mappers/proposal";
import { toOffchainVote, rawVoteSchema } from "@/mappers/vote";
import type { DataProvider } from "@/provider/dataProvider.interface";
import type { OffchainProposal, OffchainVote } from "@/repository/schema";

const PAGE_SIZE = 1000;

const PROPOSAL_FIELDS = `
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
  scores
  scores_total
  quorum
  choices
  network
  snapshot
  strategies {
    name
    network
    params
  }
`;

const PROPOSALS_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $pageSize: Int!) {
    proposals(
      where: { space: $spaceId, created_gt: $cursor }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      ${PROPOSAL_FIELDS}
    }
  }
`;

// Re-reads specific proposals regardless of the forward-only cursor. Shutter
// proposals reveal their tally after voting closes, by which point the cursor
// has already moved past them, so without this their scores stay at zero. Also
// backs the metadata backfill, which walks proposals in batches by id.
const PROPOSALS_BY_IDS_QUERY = `
  query ($ids: [String!]!, $pageSize: Int!) {
    proposals(
      where: { id_in: $ids }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      ${PROPOSAL_FIELDS}
    }
  }
`;

// Uses created_gte (not created_gt) so this matches the DB reconciliation scan,
// which is inclusive at the `since` boundary (gte). An exclusive filter here
// would drop live proposals created exactly at `since` and cause reconciliation
// to delete them. Pagination also advances with created_gte and de-dupes by id,
// so proposals sharing a `created` second across a page boundary aren't skipped.
const PROPOSAL_IDS_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $pageSize: Int!) {
    proposals(
      where: { space: $spaceId, created_gte: $cursor }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      id
      created
    }
  }
`;

const VOTE_FIELDS = `
  id
  voter
  proposal {
    id
  }
  choice
  vp
  reason
  created
`;

const VOTES_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $pageSize: Int!) {
    votes(
      where: { space: $spaceId, created_gt: $cursor }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      ${VOTE_FIELDS}
    }
  }
`;

// Same reason as PROPOSALS_BY_IDS_QUERY: a Shutter vote is first ingested with
// its choice still encrypted, and the reveal rewrites it in place on Snapshot.
const VOTES_BY_PROPOSAL_IDS_QUERY = `
  query ($ids: [String]!, $cursor: Int!, $pageSize: Int!) {
    votes(
      where: { proposal_in: $ids, created_gt: $cursor }
      first: $pageSize
      orderBy: "created"
      orderDirection: asc
    ) {
      ${VOTE_FIELDS}
    }
  }
`;

interface SnapshotGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class SnapshotProvider implements DataProvider {
  private readonly client: AxiosInstance;

  constructor(
    client: AxiosInstance,
    private readonly spaceId: string,
  ) {
    this.client = client;
  }

  async fetchProposals(
    cursor: string | null,
  ): Promise<{ data: OffchainProposal[]; nextCursor: string | null }> {
    const cursorInt = cursor ? parseInt(cursor, 10) : 0;

    const response = await this.query<{
      proposals: z.input<typeof rawProposalSchema>[];
    }>(PROPOSALS_QUERY, {
      spaceId: this.spaceId,
      cursor: cursorInt,
      pageSize: PAGE_SIZE,
    });

    const proposals: OffchainProposal[] = response.proposals.map((p) =>
      offchainProposalSchema(this.spaceId).parse(p),
    );

    const nextCursor =
      proposals.length >= PAGE_SIZE
        ? String(proposals[proposals.length - 1]!.created)
        : null;

    return { data: proposals, nextCursor };
  }

  async fetchProposalIdsSince(since: number): Promise<string[]> {
    const ids = new Set<string>();
    let cursor = since;

    while (true) {
      const response = await this.query<{
        proposals: { id: string; created: number }[];
      }>(PROPOSAL_IDS_QUERY, {
        spaceId: this.spaceId,
        cursor,
        pageSize: PAGE_SIZE,
      });

      if (response.proposals.length === 0) break;

      for (const proposal of response.proposals) {
        ids.add(proposal.id);
      }

      if (response.proposals.length < PAGE_SIZE) break;

      const lastCreated =
        response.proposals[response.proposals.length - 1]!.created;

      // created_gte re-fetches the boundary second (Set de-dupes), so a full page
      // that ends on a shared `created` second keeps its later proposals. If the
      // whole page shares one second, advancing by +1 avoids an infinite loop at
      // the cost of dropping any overflow past PAGE_SIZE in that single second —
      // acceptable: >1000 proposals in one second is not a real Snapshot space.
      // ponytail: +1 fallback bounds the loop; revisit only if such spaces exist.
      cursor =
        lastCreated === response.proposals[0]!.created
          ? lastCreated + 1
          : lastCreated;
    }

    return [...ids];
  }

  async fetchVotes(
    cursor: string | null,
  ): Promise<{ data: OffchainVote[]; nextCursor: string | null }> {
    const cursorInt = cursor ? parseInt(cursor, 10) : 0;

    const response = await this.query<{
      votes: z.input<typeof rawVoteSchema>[];
    }>(VOTES_QUERY, {
      spaceId: this.spaceId,
      cursor: cursorInt,
      pageSize: PAGE_SIZE,
    });

    const votes: OffchainVote[] = response.votes.map((v) =>
      toOffchainVote(this.spaceId).parse(v),
    );

    const nextCursor =
      votes.length >= PAGE_SIZE
        ? String(votes[votes.length - 1]!.created)
        : null;

    return { data: votes, nextCursor };
  }

  async fetchProposalsByIds(ids: string[]): Promise<OffchainProposal[]> {
    if (ids.length === 0) return [];

    const response = await this.query<{
      proposals: z.input<typeof rawProposalSchema>[];
    }>(PROPOSALS_BY_IDS_QUERY, { ids, pageSize: PAGE_SIZE });

    return response.proposals.map((p) =>
      offchainProposalSchema(this.spaceId).parse(p),
    );
  }

  async fetchVotesByProposalIds(ids: string[]): Promise<OffchainVote[]> {
    if (ids.length === 0) return [];

    const votes: OffchainVote[] = [];
    let cursor = 0;

    // Paginated: a single proposal can hold more than PAGE_SIZE votes.
    while (true) {
      const response = await this.query<{
        votes: z.input<typeof rawVoteSchema>[];
      }>(VOTES_BY_PROPOSAL_IDS_QUERY, {
        ids,
        cursor,
        pageSize: PAGE_SIZE,
      });

      if (response.votes.length === 0) break;

      const page = response.votes.map((v) =>
        toOffchainVote(this.spaceId).parse(v),
      );
      votes.push(...page);

      if (page.length < PAGE_SIZE) break;

      const lastCreated = page[page.length - 1]!.created;
      // Guard the same shared-second edge case as fetchProposalIdsSince: if a
      // whole page lands on one second, step past it rather than loop forever.
      cursor = lastCreated === page[0]!.created ? lastCreated + 1 : lastCreated;
    }

    return votes;
  }

  private async query<T>(
    queryString: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.client.post<SnapshotGraphQLResponse<T>>("", {
      query: queryString,
      variables,
    });

    const json = response.data;

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
