import { and, asc, desc, eq, gte, lte, inArray, SQL } from "drizzle-orm";

import { OffchainDrizzle, offchainProposals, offchainVotes } from "@/database";
import { DBOffchainVote } from "@/mappers";

export class OffchainVoteRepository {
  constructor(private readonly db: OffchainDrizzle) {}

  async getVotes(
    skip: number,
    limit: number,
    orderBy: "created" | "vp",
    orderDirection: "asc" | "desc",
    voterAddresses?: string[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{
    items: (DBOffchainVote & { proposalTitle: string })[];
    totalCount: number;
  }> {
    const whereClauses: SQL<unknown>[] = [];

    if (voterAddresses && voterAddresses.length > 0) {
      whereClauses.push(inArray(offchainVotes.voter, voterAddresses));
    }
    if (fromDate) {
      whereClauses.push(gte(offchainVotes.created, fromDate));
    }
    if (toDate) {
      whereClauses.push(lte(offchainVotes.created, toDate));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    const sortColumn =
      orderBy === "vp" ? offchainVotes.vp : offchainVotes.created;
    const orderFn = orderDirection === "asc" ? asc : desc;

    const [items, totalCount] = await Promise.all([
      this.db
        .select({
          spaceId: offchainVotes.spaceId,
          voter: offchainVotes.voter,
          proposalId: offchainVotes.proposalId,
          choice: offchainVotes.choice,
          vp: offchainVotes.vp,
          reason: offchainVotes.reason,
          created: offchainVotes.created,
          proposalTitle: offchainProposals.title,
        })
        .from(offchainVotes)
        .leftJoin(
          offchainProposals,
          eq(offchainVotes.proposalId, offchainProposals.id),
        )
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(skip),
      this.db.$count(offchainVotes, where),
    ]);

    return {
      items: items.map(({ proposalTitle, ...rest }) => ({
        ...rest,
        proposalTitle: proposalTitle ?? "Untitled Proposal",
      })),
      totalCount,
    };
  }

  async getVotesByProposalId(
    proposalId: string,
    skip: number,
    limit: number,
    orderBy: "created" | "vp",
    orderDirection: "asc" | "desc",
    voterAddresses?: string[],
    fromDate?: number,
    toDate?: number,
  ): Promise<{
    items: (DBOffchainVote & { proposalTitle: string })[];
    totalCount: number;
  }> {
    const whereClauses: SQL<unknown>[] = [
      eq(offchainVotes.proposalId, proposalId),
    ];

    if (voterAddresses && voterAddresses.length > 0) {
      whereClauses.push(inArray(offchainVotes.voter, voterAddresses));
    }
    if (fromDate) {
      whereClauses.push(gte(offchainVotes.created, fromDate));
    }
    if (toDate) {
      whereClauses.push(lte(offchainVotes.created, toDate));
    }

    const where = and(...whereClauses);

    const sortColumn =
      orderBy === "vp" ? offchainVotes.vp : offchainVotes.created;
    const orderFn = orderDirection === "asc" ? asc : desc;

    const [items, totalCount] = await Promise.all([
      this.db
        .select({
          spaceId: offchainVotes.spaceId,
          voter: offchainVotes.voter,
          proposalId: offchainVotes.proposalId,
          choice: offchainVotes.choice,
          vp: offchainVotes.vp,
          reason: offchainVotes.reason,
          created: offchainVotes.created,
          proposalTitle: offchainProposals.title,
        })
        .from(offchainVotes)
        .leftJoin(
          offchainProposals,
          eq(offchainVotes.proposalId, offchainProposals.id),
        )
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(skip),
      this.db.$count(offchainVotes, where),
    ]);

    return {
      items: items.map(({ proposalTitle, ...rest }) => ({
        ...rest,
        proposalTitle: proposalTitle ?? "Untitled Proposal",
      })),
      totalCount,
    };
  }
}
