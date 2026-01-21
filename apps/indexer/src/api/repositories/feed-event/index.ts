import { db } from "ponder:api";
import { and, asc, desc, gte, inArray, lte, eq, sql } from "drizzle-orm";
import {
  feedEvent,
  votesOnchain,
  proposalsOnchain,
  transfer,
  delegation,
  accountPower,
} from "ponder:schema";

import {
  FeedEventRequest,
  DBFeedEvent,
  DBFeedEventWithVote,
  DBFeedEventWithProposal,
  DBFeedEventWithTransfer,
  DBFeedEventWithDelegation,
  FeedEventType,
  FeedEventRelevance,
  FeedEventTypeEnum,
} from "@/api/mappers";

type DBFeedEventBase = {
  txHash: string;
  logIndex: number;
  daoId: string;
  type: FeedEventType;
  relevance: FeedEventRelevance;
  timestamp: bigint;
};

export class FeedEventRepository {
  async getFeedEventsCount(req: FeedEventRequest): Promise<number> {
    return await db.$count(feedEvent, this.buildWhereClause(req));
  }

  async getFeedEvents(req: FeedEventRequest): Promise<DBFeedEvent[]> {
    const orderBy =
      req.sortOrder === "desc"
        ? desc(feedEvent.timestamp)
        : asc(feedEvent.timestamp);

    // First, get the feed events matching the filters
    const baseEvents = await db
      .select({
        txHash: feedEvent.txHash,
        logIndex: feedEvent.logIndex,
        daoId: feedEvent.daoId,
        type: feedEvent.type,
        relevance: feedEvent.relevance,
        timestamp: feedEvent.timestamp,
      })
      .from(feedEvent)
      .where(this.buildWhereClause(req))
      .orderBy(orderBy)
      .limit(req.limit)
      .offset(req.offset);

    if (baseEvents.length === 0) {
      return [];
    }

    // Group events by type for efficient fetching
    const voteEvents = baseEvents.filter(
      (e) => e.type === FeedEventTypeEnum.VOTE,
    );
    const proposalEvents = baseEvents.filter(
      (e) => e.type === FeedEventTypeEnum.PROPOSAL,
    );
    const transferEvents = baseEvents.filter(
      (e) => e.type === FeedEventTypeEnum.TRANSFER,
    );
    const delegationEvents = baseEvents.filter(
      (e) => e.type === FeedEventTypeEnum.DELEGATION,
    );

    // Fetch details in parallel
    const [voteDetails, proposalDetails, transferDetails, delegationDetails] =
      await Promise.all([
        this.fetchVoteDetails(voteEvents),
        this.fetchProposalDetails(proposalEvents),
        this.fetchTransferDetails(transferEvents),
        this.fetchDelegationDetails(delegationEvents),
      ]);

    // Combine results maintaining original order
    const results: DBFeedEvent[] = baseEvents
      .map((event) => {
        switch (event.type) {
          case FeedEventTypeEnum.VOTE:
            return voteDetails.find(
              (v) => v.txHash === event.txHash && v.logIndex === event.logIndex,
            );
          case FeedEventTypeEnum.PROPOSAL:
            return proposalDetails.find(
              (p) => p.txHash === event.txHash && p.logIndex === event.logIndex,
            );
          case FeedEventTypeEnum.TRANSFER:
            return transferDetails.find(
              (t) => t.txHash === event.txHash && t.logIndex === event.logIndex,
            );
          case FeedEventTypeEnum.DELEGATION:
            return delegationDetails.find(
              (d) => d.txHash === event.txHash && d.logIndex === event.logIndex,
            );
          default:
            return undefined;
        }
      })
      .filter((e): e is DBFeedEvent => e !== undefined);

    return results;
  }

  private buildWhereClause(req: FeedEventRequest) {
    return and(
      req.fromTimestamp
        ? gte(feedEvent.timestamp, BigInt(req.fromTimestamp))
        : undefined,
      req.toTimestamp
        ? lte(feedEvent.timestamp, BigInt(req.toTimestamp))
        : undefined,
      req.types && req.types.length > 0
        ? inArray(feedEvent.type, req.types)
        : undefined,
      req.relevances && req.relevances.length > 0
        ? inArray(feedEvent.relevance, req.relevances)
        : undefined,
    );
  }

  private async fetchVoteDetails(
    events: DBFeedEventBase[],
  ): Promise<DBFeedEventWithVote[]> {
    if (events.length === 0) return [];

    const txHashes = events.map((e) => e.txHash);

    const votes = await db
      .select({
        txHash: votesOnchain.txHash,
        voterAccountId: votesOnchain.voterAccountId,
        votingPower: votesOnchain.votingPower,
        proposalId: votesOnchain.proposalId,
        support: votesOnchain.support,
        timestamp: votesOnchain.timestamp,
        proposalDescription: proposalsOnchain.description,
      })
      .from(votesOnchain)
      .leftJoin(
        proposalsOnchain,
        eq(votesOnchain.proposalId, proposalsOnchain.id),
      )
      .where(inArray(votesOnchain.txHash, txHashes));

    const results: DBFeedEventWithVote[] = [];
    for (const event of events) {
      const vote = votes.find((v) => v.txHash === event.txHash);
      if (!vote) continue;

      results.push({
        txHash: event.txHash,
        logIndex: event.logIndex,
        daoId: event.daoId,
        timestamp: event.timestamp,
        relevance: event.relevance as FeedEventRelevance,
        type: FeedEventTypeEnum.VOTE,
        voterAccountId: vote.voterAccountId as string,
        votingPower: vote.votingPower,
        proposalId: vote.proposalId,
        support: vote.support,
        proposalDescription: vote.proposalDescription || "",
      });
    }
    return results;
  }

  private async fetchProposalDetails(
    events: DBFeedEventBase[],
  ): Promise<DBFeedEventWithProposal[]> {
    if (events.length === 0) return [];

    const txHashes = events.map((e) => e.txHash);

    const proposals = await db
      .select({
        txHash: proposalsOnchain.txHash,
        proposerAccountId: proposalsOnchain.proposerAccountId,
        proposalId: proposalsOnchain.id,
        description: proposalsOnchain.description,
        timestamp: proposalsOnchain.timestamp,
      })
      .from(proposalsOnchain)
      .where(inArray(proposalsOnchain.txHash, txHashes));

    // Get proposer voting powers
    const proposerIds = [...new Set(proposals.map((p) => p.proposerAccountId))];
    const powers =
      proposerIds.length > 0
        ? await db
            .select({
              accountId: accountPower.accountId,
              votingPower: accountPower.votingPower,
            })
            .from(accountPower)
            .where(inArray(accountPower.accountId, proposerIds))
        : [];

    const powerMap = new Map(powers.map((p) => [p.accountId, p.votingPower]));

    const results: DBFeedEventWithProposal[] = [];
    for (const event of events) {
      const proposal = proposals.find((p) => p.txHash === event.txHash);
      if (!proposal) continue;

      results.push({
        txHash: event.txHash,
        logIndex: event.logIndex,
        daoId: event.daoId,
        timestamp: event.timestamp,
        relevance: event.relevance as FeedEventRelevance,
        type: FeedEventTypeEnum.PROPOSAL,
        proposerAccountId: proposal.proposerAccountId as string,
        proposalId: proposal.proposalId,
        description: proposal.description,
        proposerVotingPower: powerMap.get(proposal.proposerAccountId) || 0n,
      });
    }
    return results;
  }

  private async fetchTransferDetails(
    events: DBFeedEventBase[],
  ): Promise<DBFeedEventWithTransfer[]> {
    if (events.length === 0) return [];

    // Create composite keys for matching
    const keys = events.map((e) => ({
      txHash: e.txHash,
      logIndex: e.logIndex,
    }));

    const transfers = await db
      .select()
      .from(transfer)
      .where(
        sql`(${transfer.transactionHash}, ${transfer.logIndex}) IN (${sql.raw(
          keys.map((k) => `('${k.txHash}', ${k.logIndex})`).join(", "),
        )})`,
      );

    const results: DBFeedEventWithTransfer[] = [];
    for (const event of events) {
      const t = transfers.find(
        (tr) =>
          tr.transactionHash === event.txHash && tr.logIndex === event.logIndex,
      );
      if (!t) continue;

      results.push({
        txHash: event.txHash,
        logIndex: event.logIndex,
        daoId: event.daoId,
        timestamp: event.timestamp,
        relevance: event.relevance as FeedEventRelevance,
        type: FeedEventTypeEnum.TRANSFER,
        fromAccountId: t.fromAccountId as string,
        toAccountId: t.toAccountId as string,
        amount: t.amount,
        isCex: t.isCex,
        isDex: t.isDex,
        isLending: t.isLending,
      });
    }
    return results;
  }

  private async fetchDelegationDetails(
    events: DBFeedEventBase[],
  ): Promise<DBFeedEventWithDelegation[]> {
    if (events.length === 0) return [];

    // Create composite keys for matching
    const keys = events.map((e) => ({
      txHash: e.txHash,
      logIndex: e.logIndex,
    }));

    const delegations = await db
      .select()
      .from(delegation)
      .where(
        sql`(${delegation.transactionHash}, ${delegation.logIndex}) IN (${sql.raw(
          keys.map((k) => `('${k.txHash}', ${k.logIndex})`).join(", "),
        )})`,
      );

    const results: DBFeedEventWithDelegation[] = [];
    for (const event of events) {
      const d = delegations.find(
        (del) =>
          del.transactionHash === event.txHash &&
          del.logIndex === event.logIndex,
      );
      if (!d) continue;

      results.push({
        txHash: event.txHash,
        logIndex: event.logIndex,
        daoId: event.daoId,
        timestamp: event.timestamp,
        relevance: event.relevance as FeedEventRelevance,
        type: FeedEventTypeEnum.DELEGATION,
        delegatorAccountId: d.delegatorAccountId as string,
        delegateAccountId: d.delegateAccountId as string,
        previousDelegate: d.previousDelegate,
        delegatedValue: d.delegatedValue,
      });
    }
    return results;
  }
}
