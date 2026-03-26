import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  sql,
  SQL,
} from "drizzle-orm";

import { OffchainDrizzle, offchainProposals, offchainVotes } from "@/database";
import { DBOffchainProposal, DBOffchainProposalWithScores } from "@/mappers";

export class OffchainProposalRepository {
  constructor(private readonly db: OffchainDrizzle) {}

  async getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    state: string[] | undefined,
    fromDate: number | undefined,
    endDate: number | undefined,
  ): Promise<DBOffchainProposalWithScores[]> {
    const whereClauses: SQL<unknown>[] = [];

    if (state && state.length > 0) {
      // Snapshot states are lowercase (active, closed, pending)
      const statesLower = state.map((s) => s.toLowerCase());
      whereClauses.push(inArray(offchainProposals.state, statesLower));
    }

    if (fromDate) {
      whereClauses.push(gte(offchainProposals.created, fromDate));
    }

    if (endDate) {
      whereClauses.push(gte(offchainProposals.end, endDate));
    }

    const forVotesSq = this.db
      .select({
        proposalId: offchainVotes.proposalId,
        total: sql<string>`COALESCE(SUM(${offchainVotes.vp}), '0')`.as("total"),
      })
      .from(offchainVotes)
      .where(sql`${offchainVotes.choice}::text = '1'`)
      .groupBy(offchainVotes.proposalId)
      .as("for_votes");

    const againstVotesSq = this.db
      .select({
        proposalId: offchainVotes.proposalId,
        total: sql<string>`COALESCE(SUM(${offchainVotes.vp}), '0')`.as("total"),
      })
      .from(offchainVotes)
      .where(sql`${offchainVotes.choice}::text = '2'`)
      .groupBy(offchainVotes.proposalId)
      .as("against_votes");

    return this.db
      .select({
        ...getTableColumns(offchainProposals),
        forVotes: sql<string>`COALESCE(${forVotesSq.total}, '0')`,
        againstVotes: sql<string>`COALESCE(${againstVotesSq.total}, '0')`,
      })
      .from(offchainProposals)
      .leftJoin(forVotesSq, eq(offchainProposals.id, forVotesSq.proposalId))
      .leftJoin(
        againstVotesSq,
        eq(offchainProposals.id, againstVotesSq.proposalId),
      )
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
      .orderBy(
        orderDirection === "asc"
          ? asc(offchainProposals.created)
          : desc(offchainProposals.created),
      )
      .limit(limit)
      .offset(skip);
  }

  async getProposalById(
    proposalId: string,
  ): Promise<DBOffchainProposal | undefined> {
    return await this.db.query.offchainProposals.findFirst({
      where: eq(offchainProposals.id, proposalId),
    });
  }

  async getProposalsCount(
    state?: string[] | undefined,
    fromDate?: number | undefined,
    endDate?: number | undefined,
  ): Promise<number> {
    const whereClauses: SQL<unknown>[] = [];

    if (state && state.length > 0) {
      const statesLower = state.map((s) => s.toLowerCase());
      whereClauses.push(inArray(offchainProposals.state, statesLower));
    }

    if (fromDate) {
      whereClauses.push(gte(offchainProposals.created, fromDate));
    }

    if (endDate) {
      whereClauses.push(gte(offchainProposals.end, endDate));
    }

    return this.db.$count(
      offchainProposals,
      whereClauses.length > 0 ? and(...whereClauses) : undefined,
    );
  }
}
