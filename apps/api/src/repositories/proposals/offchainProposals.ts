import { and, asc, desc, eq, gte, inArray, SQL } from "drizzle-orm";

import { OffchainDrizzle, offchainProposals } from "@/database";
import { DBOffchainProposal } from "@/mappers";

export class OffchainProposalRepository {
  constructor(private readonly db: OffchainDrizzle) {}

  async getProposals(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    state: string[] | undefined,
    fromDate: number | undefined,
  ): Promise<DBOffchainProposal[]> {
    const whereClauses: SQL<unknown>[] = [];

    if (state && state.length > 0) {
      // Snapshot states are lowercase (active, closed, pending)
      const statesLower = state.map((s) => s.toLowerCase());
      whereClauses.push(inArray(offchainProposals.state, statesLower));
    }

    if (fromDate) {
      whereClauses.push(gte(offchainProposals.created, fromDate));
    }

    return await this.db
      .select()
      .from(offchainProposals)
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
    const results = await this.db
      .select()
      .from(offchainProposals)
      .where(eq(offchainProposals.id, proposalId));

    return results[0];
  }

  async getProposalsCount(
    state?: string[] | undefined,
    fromDate?: number | undefined,
  ): Promise<number> {
    const whereClauses: SQL<unknown>[] = [];

    if (state && state.length > 0) {
      const statesLower = state.map((s) => s.toLowerCase());
      whereClauses.push(inArray(offchainProposals.state, statesLower));
    }

    if (fromDate) {
      whereClauses.push(gte(offchainProposals.created, fromDate));
    }

    return this.db.$count(
      offchainProposals,
      whereClauses.length > 0 ? and(...whereClauses) : undefined,
    );
  }
}
