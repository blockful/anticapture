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

// created_gte (not created_gt) so a page boundary that falls inside a `created`
// second doesn't drop the rows sharing that second which didn't fit on the page.
// Re-reading the boundary second is free: every write path upserts. `skip` pages
// deeper into a second that fills a whole page, where the cursor cannot advance.
const PROPOSALS_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $skip: Int!, $pageSize: Int!) {
    proposals(
      where: { space: $spaceId, created_gte: $cursor }
      first: $pageSize
      skip: $skip
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
// `skip` walks the overflow when a whole page lands on one second.
const PROPOSAL_IDS_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $skip: Int!, $pageSize: Int!) {
    proposals(
      where: { space: $spaceId, created_gte: $cursor }
      first: $pageSize
      skip: $skip
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

// created_gte + skip for the same reason as PROPOSALS_QUERY above: with an
// exclusive cursor, every page boundary that lands mid-second silently loses the
// rest of that second — the common case here, since votes arrive in bursts.
const VOTES_QUERY = `
  query ($spaceId: String!, $cursor: Int!, $skip: Int!, $pageSize: Int!) {
    votes(
      where: { space: $spaceId, created_gte: $cursor }
      first: $pageSize
      skip: $skip
      orderBy: "created"
      orderDirection: asc
    ) {
      ${VOTE_FIELDS}
    }
  }
`;

// Same reason as PROPOSALS_BY_IDS_QUERY: a Shutter vote is first ingested with
// its choice still encrypted, and the reveal rewrites it in place on Snapshot.
// created_gte (not created_gt) for the same reason as PROPOSAL_IDS_QUERY: an
// exclusive cursor drops votes that share the last returned vote's `created`
// second but didn't fit on that page. The caller de-dupes the overlap, and
// pages deeper into a shared second with `skip` instead of stepping past it.
const VOTES_BY_PROPOSAL_IDS_QUERY = `
  query ($ids: [String]!, $cursor: Int!, $skip: Int!, $pageSize: Int!) {
    votes(
      where: { proposal_in: $ids, created_gte: $cursor }
      first: $pageSize
      skip: $skip
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
    const { rows, lastCreated, full } = await this.fetchPage(
      PROPOSALS_QUERY,
      "proposals",
      { spaceId: this.spaceId, cursor: cursor ? parseInt(cursor, 10) : 0 },
      (raw: z.input<typeof rawProposalSchema>) =>
        offchainProposalSchema(this.spaceId).parse(raw),
      (proposal) => proposal.id,
    );

    return { data: rows, nextCursor: full ? String(lastCreated) : null };
  }

  async fetchProposalIdsSince(since: number): Promise<string[]> {
    const ids = new Set<string>();
    let cursor = since;

    // Walks to the end: the caller diffs the full live set against the DB, so a
    // partial answer would delete proposals that do exist. The Set absorbs the
    // boundary second each step re-reads.
    while (true) {
      const { rows, lastCreated, full } = await this.fetchPage(
        PROPOSAL_IDS_QUERY,
        "proposals",
        { spaceId: this.spaceId, cursor },
        (raw: { id: string; created: number }) => raw,
        (proposal) => proposal.id,
      );

      for (const proposal of rows) ids.add(proposal.id);

      if (!full) break;

      cursor = lastCreated!;
    }

    return [...ids];
  }

  async fetchVotes(
    cursor: string | null,
  ): Promise<{ data: OffchainVote[]; nextCursor: string | null }> {
    const { rows, lastCreated, full } = await this.fetchPage(
      VOTES_QUERY,
      "votes",
      { spaceId: this.spaceId, cursor: cursor ? parseInt(cursor, 10) : 0 },
      (raw: z.input<typeof rawVoteSchema>) =>
        toOffchainVote(this.spaceId).parse(raw),
      (vote) => `${vote.proposalId}:${vote.voter}`,
    );

    return { data: rows, nextCursor: full ? String(lastCreated) : null };
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

    // De-duped because the created_gte cursor re-reads the boundary second on
    // every page, so the last vote of a full page always comes back on the next
    // one. Keyed on (proposalId, voter), the votes table's primary key, so a
    // revote seen twice mid-walk collapses to its latest version, matching what
    // the upsert would do anyway.
    const votesByKey = new Map<string, OffchainVote>();
    let cursor = 0;

    // Walks to the end: a single proposal can hold more than PAGE_SIZE votes, and
    // a vote missed here keeps its encrypted choice forever — writing the revealed
    // tally is what drops the proposal from getRevealPendingProposalIds.
    while (true) {
      const { rows, lastCreated, full } = await this.fetchPage(
        VOTES_BY_PROPOSAL_IDS_QUERY,
        "votes",
        { ids, cursor },
        (raw: z.input<typeof rawVoteSchema>) =>
          toOffchainVote(this.spaceId).parse(raw),
        (vote) => `${vote.proposalId}:${vote.voter}`,
      );

      for (const vote of rows) {
        votesByKey.set(`${vote.proposalId}:${vote.voter}`, vote);
      }

      if (!full) break;

      cursor = lastCreated!;
    }

    return [...votesByKey.values()];
  }

  /**
   * Reads one page at `cursor`, then keeps paging with `skip` while the whole
   * page sits on a single `created` second.
   *
   * Every query here filters with created_gte, so the caller can advance to
   * `lastCreated` without dropping rows that share that second. The one case
   * that breaks is a page filled entirely by one second: `lastCreated` equals
   * where we started, so stepping to it makes no progress and stepping past it
   * drops the overflow. `skip` walks that second instead.
   *
   * Rows are de-duped by `key`: Postgres rejects a batch upsert that touches the
   * same row twice, and Snapshot's ordering within a shared second isn't
   * guaranteed stable across requests. `full` reports whether the last page came
   * back full — the length of the de-duped result can't answer that.
   */
  private async fetchPage<Raw, Row extends { created: number }>(
    queryString: string,
    field: "proposals" | "votes",
    variables: Record<string, unknown>,
    parse: (raw: Raw) => Row,
    key: (row: Row) => string,
  ): Promise<{ rows: Row[]; lastCreated: number | null; full: boolean }> {
    const rowsByKey = new Map<string, Row>();
    let lastCreated: number | null = null;
    let full = false;
    let skip = 0;

    while (true) {
      const response = await this.query<Record<string, Raw[]>>(queryString, {
        ...variables,
        skip,
        pageSize: PAGE_SIZE,
      });

      const page = (response[field] ?? []).map(parse);

      if (page.length === 0) break;

      for (const row of page) rowsByKey.set(key(row), row);

      lastCreated = page[page.length - 1]!.created;
      full = page.length >= PAGE_SIZE;

      if (!full || lastCreated !== page[0]!.created) break;

      skip += PAGE_SIZE;
    }

    return { rows: [...rowsByKey.values()], lastCreated, full };
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
