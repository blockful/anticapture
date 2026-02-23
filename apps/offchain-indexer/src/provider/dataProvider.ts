import { AxiosError, type AxiosInstance } from "axios";
import type { OffchainProposal, OffchainVote } from "@/repository/schema";
import type { DataProvider } from "@/provider/dataProvider.interface";
import { toOffchainVote, rawVoteSchema } from "@/mappers/vote";
import { rawProposalSchema, offchainProposalSchema} from "@/mappers/proposal"

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

export class SnapshotProvider implements DataProvider {
  private readonly client: AxiosInstance;

  constructor(
    client: AxiosInstance,
    private readonly spaceId: string,
  ) {
    this.client = client;
  }

  async fetchProposals(cursor: string | null): Promise<{ data: OffchainProposal[]; nextCursor: string | null }> {
    const cursorInt = cursor ? parseInt(cursor, 10) : 0;

    const response = await this.query<{ proposals: typeof rawProposalSchema[] }>(
      PROPOSALS_QUERY,
      { spaceId: this.spaceId, cursor: cursorInt, pageSize: PAGE_SIZE },
    );

    const proposals: OffchainProposal[] = response.proposals.map((p) =>
      offchainProposalSchema(this.spaceId).parse(p),
    );

    const nextCursor =
      proposals.length >= PAGE_SIZE
        ? String(proposals[proposals.length - 1]!.created)
        : null;

    return { data: proposals, nextCursor };
  }

  async fetchVotes(cursor: string | null): Promise<{ data: OffchainVote[]; nextCursor: string | null }> {
    const cursorInt = cursor ? parseInt(cursor, 10) : 0;

    const response = await this.query<{ votes: typeof rawVoteSchema[] }>(
      VOTES_QUERY,
      { spaceId: this.spaceId, cursor: cursorInt, pageSize: PAGE_SIZE },
    );

    const votes: OffchainVote[] = response.votes.map((v) =>
      toOffchainVote(this.spaceId).parse(v),
    );

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
