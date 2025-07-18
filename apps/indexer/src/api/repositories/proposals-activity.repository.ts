import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { eq, sql } from "ponder";
import { db } from "ponder:api";
import {
  accountPower,
  dao,
  proposalsOnchain,
  votesOnchain,
} from "ponder:schema";

export type Vote = typeof votesOnchain.$inferSelect;
export type Proposal = typeof proposalsOnchain.$inferSelect;
export type ProposalWithVotes = Proposal & { votes: Vote[] };

export interface ProposalsActivityRepository {
  getProposals(limit: number, skip: number): Promise<Proposal[]>;
  getProposalById(id: string): Promise<Proposal | undefined>;
  getFirstVoteTimestamp(address: Address): Promise<bigint | undefined>;
  getDaoVotingPeriod(daoId: DaoIdEnum): Promise<number | undefined>;
  getProposalsWithVotes(
    activityStart: number,
    votingPeriodSeconds: number,
    skip: number,
    limit: number,
  ): Promise<ProposalWithVotes[]>;
}

export class DrizzleProposalsActivityRepository
  implements ProposalsActivityRepository
{
  async getProposals(limit: number, skip: number): Promise<Proposal[]> {
    return await db.query.proposalsOnchain.findMany({
      limit,
      offset: skip,
    });
  }

  async getProposalById(id: string): Promise<Proposal | undefined> {
    return await db.query.proposalsOnchain.findFirst({
      where: eq(proposalsOnchain.id, id),
    });
  }

  async getFirstVoteTimestamp(address: Address): Promise<bigint | undefined> {
    const account = await db.query.accountPower.findFirst({
      where: eq(accountPower.accountId, address),
      columns: {
        firstVoteTimestamp: true,
      },
    });

    return account?.firstVoteTimestamp ?? undefined;
  }

  async getDaoVotingPeriod(daoId: DaoIdEnum): Promise<number | undefined> {
    const votingPeriod = await db.query.dao.findFirst({
      where: eq(dao.id, daoId),
      columns: {
        votingPeriod: true,
      },
    });

    return Number(votingPeriod);
  }

  async getProposalsWithVotes(
    activityStart: number,
    votingPeriodSeconds: number,
    skip: number,
    limit: number,
  ): Promise<ProposalWithVotes[]> {
    return await db.query.proposalsOnchain.findMany({
      where: sql<number>`(timestamp + ${votingPeriodSeconds}) >= ${activityStart}`,
      with: {
        votes: {
          where: eq(votesOnchain.proposalId, proposalsOnchain.id),
        },
      },
      orderBy: (proposalsOnchain, { desc }) => [
        desc(proposalsOnchain.timestamp),
      ],
      limit,
      offset: skip,
    });
  }
}
