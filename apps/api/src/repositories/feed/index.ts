import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";

import {
  delegation,
  feedEvent,
  proposalsOnchain,
  ReadonlyDrizzle,
  transfer,
  votesOnchain,
} from "@/database";
import { FeedEventType } from "@/lib/constants";
import {
  DBFeedEvent,
  FeedDelegationMetadataSchema,
  FeedProposalExtendedMetadataSchema,
  FeedProposalMetadataSchema,
  FeedRequest,
  FeedTransferMetadataSchema,
  FeedVoteMetadataSchema,
} from "@/mappers";

type DelegationMeta = z.infer<typeof FeedDelegationMetadataSchema>;
type TransferMeta = z.infer<typeof FeedTransferMetadataSchema>;
type VoteMeta = z.infer<typeof FeedVoteMetadataSchema>;
type ProposalMeta = z.infer<typeof FeedProposalMetadataSchema>;
type ProposalExtendedMeta = z.infer<typeof FeedProposalExtendedMetadataSchema>;

type FeedMetadata =
  | DelegationMeta
  | TransferMeta
  | VoteMeta
  | ProposalMeta
  | ProposalExtendedMeta;

type EnrichedFeedEvent = DBFeedEvent & {
  metadata: FeedMetadata | null;
};

export class FeedRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getFeedEvents(
    req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ): Promise<{
    items: EnrichedFeedEvent[];
    totalCount: number;
  }> {
    const { skip, limit, orderBy, orderDirection, type, fromDate, toDate } =
      req;

    const relevanceFilter = this.buildRelevanceFilter(type, valueThresholds);

    const where = and(
      fromDate ? gte(feedEvent.timestamp, fromDate) : undefined,
      toDate ? lte(feedEvent.timestamp, toDate) : undefined,
      relevanceFilter,
    );

    const orderByColumn =
      orderBy === "timestamp" ? feedEvent.timestamp : feedEvent.value;
    const orderByFn =
      orderDirection === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [rows, totalCount] = await Promise.all([
      this.db.query.feedEvent.findMany({
        where,
        orderBy: orderByFn,
        offset: skip,
        limit,
      }),
      this.db.$count(feedEvent, where),
    ]);

    const items = await this.enrichWithMetadata(rows);

    return { items, totalCount };
  }

  private async enrichWithMetadata(
    rows: DBFeedEvent[],
  ): Promise<EnrichedFeedEvent[]> {
    if (rows.length === 0) return [];

    const delegationKeys = rows
      .filter((r) => r.type === FeedEventType.DELEGATION)
      .map((r) => ({ txHash: r.txHash, logIndex: r.logIndex }));
    const transferKeys = rows
      .filter((r) => r.type === FeedEventType.TRANSFER)
      .map((r) => ({ txHash: r.txHash, logIndex: r.logIndex }));
    const voteKeys = rows
      .filter((r) => r.type === FeedEventType.VOTE)
      .map((r) => ({ txHash: r.txHash, logIndex: r.logIndex }));
    // A PROPOSAL creation event and its proposal row are written from the same
    // log, so match them by txHash (one ProposalCreated per tx). This avoids
    // relying on feed_event.proposal_id, which some governors (e.g. TORN) leave
    // null on the creation event. PROPOSAL_EXTENDED lives in a different tx, so
    // it still keys by proposal_id.
    const proposalTxHashes = Array.from(
      new Set(
        rows
          .filter((r) => r.type === FeedEventType.PROPOSAL)
          .map((r) => r.txHash),
      ),
    );
    const extendedProposalIds = Array.from(
      new Set(
        rows
          .filter((r) => r.type === FeedEventType.PROPOSAL_EXTENDED)
          .map((r) => r.proposalId)
          .filter((id): id is string => id != null),
      ),
    );

    const [delegations, transfers, votes, createdProposals, extendedProposals] =
      await Promise.all([
        this.fetchDelegations(delegationKeys),
        this.fetchTransfers(transferKeys),
        this.fetchVotes(voteKeys),
        this.fetchProposalsByTxHash(proposalTxHashes),
        this.fetchProposals(extendedProposalIds),
      ]);

    const delegationByKey = new Map(
      delegations.map((d) => [`${d.transactionHash}:${d.logIndex}`, d]),
    );
    const transferByKey = new Map(
      transfers.map((t) => [`${t.transactionHash}:${t.logIndex}`, t]),
    );
    const voteByKey = new Map(
      votes.map((v) => [`${v.txHash}:${v.logIndex}`, v]),
    );
    const proposalByTxHash = new Map(
      createdProposals.map((p) => [p.txHash, p]),
    );
    const proposalById = new Map(extendedProposals.map((p) => [p.id, p]));

    return rows.map((row) => ({
      ...row,
      metadata: this.buildMetadata(row, {
        delegationByKey,
        transferByKey,
        voteByKey,
        proposalByTxHash,
        proposalById,
      }),
    }));
  }

  private buildMetadata(
    row: DBFeedEvent,
    lookups: {
      delegationByKey: Map<string, DelegationRow>;
      transferByKey: Map<string, TransferRow>;
      voteByKey: Map<string, VoteRow>;
      proposalByTxHash: Map<string, ProposalRow>;
      proposalById: Map<string, ProposalRow>;
    },
  ): FeedMetadata | null {
    const key = `${row.txHash}:${row.logIndex}`;
    switch (row.type) {
      case FeedEventType.DELEGATION: {
        const d = lookups.delegationByKey.get(key);
        if (!d) return null;
        const meta: DelegationMeta = {
          kind: FeedEventType.DELEGATION,
          delegator: d.delegatorAccountId,
          delegate: d.delegateAccountId,
          previousDelegate: d.previousDelegate,
          amount: d.delegatedValue.toString(),
        };
        return meta;
      }
      case FeedEventType.TRANSFER: {
        const t = lookups.transferByKey.get(key);
        if (!t) return null;
        const meta: TransferMeta = {
          kind: FeedEventType.TRANSFER,
          from: t.fromAccountId,
          to: t.toAccountId,
          amount: t.amount.toString(),
        };
        return meta;
      }
      case FeedEventType.VOTE: {
        const v = lookups.voteByKey.get(key);
        if (!v) return null;
        const meta: VoteMeta = {
          kind: FeedEventType.VOTE,
          voter: v.voterAccountId,
          reason: v.reason,
          support: Number(v.support),
          votingPower: v.votingPower.toString(),
          proposalId: v.proposalId,
          title: v.proposalTitle ?? undefined,
        };
        return meta;
      }
      case FeedEventType.PROPOSAL: {
        const p = lookups.proposalByTxHash.get(row.txHash);
        if (!p) return null;
        const meta: ProposalMeta = {
          kind: FeedEventType.PROPOSAL,
          id: p.id,
          proposer: p.proposerAccountId,
          votingPower: p.proposerVotingPower ?? "0",
          title: p.title,
        };
        return meta;
      }
      case FeedEventType.PROPOSAL_EXTENDED: {
        if (!row.proposalId) return null;
        const p = lookups.proposalById.get(row.proposalId);
        if (!p) return null;
        const meta: ProposalExtendedMeta = {
          kind: FeedEventType.PROPOSAL_EXTENDED,
          id: p.id,
          title: p.title,
          endBlock: p.endBlock,
          endTimestamp: p.endTimestamp.toString(),
          proposer: p.proposerAccountId,
        };
        return meta;
      }
      default:
        return null;
    }
  }

  private async fetchDelegations(
    keys: { txHash: string; logIndex: number }[],
  ): Promise<DelegationRow[]> {
    if (keys.length === 0) return [];
    return this.db
      .select({
        transactionHash: delegation.transactionHash,
        logIndex: delegation.logIndex,
        delegatorAccountId: delegation.delegatorAccountId,
        delegateAccountId: delegation.delegateAccountId,
        previousDelegate: delegation.previousDelegate,
        delegatedValue: delegation.delegatedValue,
      })
      .from(delegation)
      .where(
        buildKeyFilter(delegation.transactionHash, delegation.logIndex, keys),
      );
  }

  private async fetchTransfers(
    keys: { txHash: string; logIndex: number }[],
  ): Promise<TransferRow[]> {
    if (keys.length === 0) return [];
    return this.db
      .select({
        transactionHash: transfer.transactionHash,
        logIndex: transfer.logIndex,
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        amount: transfer.amount,
      })
      .from(transfer)
      .where(buildKeyFilter(transfer.transactionHash, transfer.logIndex, keys));
  }

  private async fetchVotes(
    keys: { txHash: string; logIndex: number }[],
  ): Promise<VoteRow[]> {
    if (keys.length === 0) return [];
    return this.db
      .select({
        txHash: votesOnchain.txHash,
        logIndex: votesOnchain.logIndex,
        voterAccountId: votesOnchain.voterAccountId,
        proposalId: votesOnchain.proposalId,
        support: votesOnchain.support,
        votingPower: votesOnchain.votingPower,
        reason: votesOnchain.reason,
        proposalTitle: proposalsOnchain.title,
      })
      .from(votesOnchain)
      .leftJoin(
        proposalsOnchain,
        eq(votesOnchain.proposalId, proposalsOnchain.id),
      )
      .where(buildKeyFilter(votesOnchain.txHash, votesOnchain.logIndex, keys));
  }

  private async fetchProposals(proposalIds: string[]): Promise<ProposalRow[]> {
    if (proposalIds.length === 0) return [];
    return this.selectProposals(inArray(proposalsOnchain.id, proposalIds));
  }

  private async fetchProposalsByTxHash(
    txHashes: string[],
  ): Promise<ProposalRow[]> {
    if (txHashes.length === 0) return [];
    return this.selectProposals(inArray(proposalsOnchain.txHash, txHashes));
  }

  private selectProposals(where: SQL): Promise<ProposalRow[]> {
    return this.db
      .select({
        id: proposalsOnchain.id,
        txHash: proposalsOnchain.txHash,
        proposerAccountId: proposalsOnchain.proposerAccountId,
        title: proposalsOnchain.title,
        endBlock: proposalsOnchain.endBlock,
        endTimestamp: proposalsOnchain.endTimestamp,
        // Proposer voting power at the moment the proposal was created — the
        // latest voting_power_history row for the proposer at or before the
        // proposal's timestamp. Tie-break by log_index DESC so same-block
        // VPH updates resolve deterministically. Cast to text so the value
        // is a string in both node-postgres and PGlite. Inline raw column
        // references with explicit aliases — Drizzle's sql`` template strips
        // table prefixes for column refs, which makes `timestamp <= timestamp`
        // resolve as self-comparison inside a correlated subquery.
        proposerVotingPower: sql<string | null>`(
          SELECT vph.voting_power::text
          FROM voting_power_history AS vph
          WHERE vph.account_id = proposals_onchain.proposer_account_id
            AND vph.timestamp <= proposals_onchain.timestamp
          ORDER BY vph.timestamp DESC, vph.log_index DESC
          LIMIT 1
        )`,
      })
      .from(proposalsOnchain)
      .where(where);
  }

  private buildRelevanceFilter(
    types: FeedEventType[] | undefined,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ): SQL | undefined {
    const conditions: SQL[] = [];
    const selectedTypes =
      types && types.length > 0
        ? types
        : (Object.keys(valueThresholds) as FeedEventType[]);

    for (const eventType of selectedTypes) {
      const threshold = valueThresholds[eventType];
      if (threshold === undefined) continue;
      conditions.push(
        and(eq(feedEvent.type, eventType), gte(feedEvent.value, threshold))!,
      );
    }

    return conditions.length > 0 ? or(...conditions) : undefined;
  }
}

type DelegationRow = {
  transactionHash: string;
  logIndex: number;
  delegatorAccountId: string;
  delegateAccountId: string;
  previousDelegate: string | null;
  delegatedValue: bigint;
};

type TransferRow = {
  transactionHash: string;
  logIndex: number;
  fromAccountId: string;
  toAccountId: string;
  amount: bigint;
};

type VoteRow = {
  txHash: string;
  logIndex: number;
  voterAccountId: string;
  proposalId: string;
  support: string;
  votingPower: bigint;
  reason: string | null;
  proposalTitle: string | null;
};

type ProposalRow = {
  id: string;
  txHash: string;
  proposerAccountId: string;
  title: string;
  endBlock: number;
  endTimestamp: bigint;
  // Returned as a string from the scalar subquery (node-postgres serializes
  // int8 as a string when there's no Drizzle column descriptor to bind it to).
  proposerVotingPower: string | null;
};

function buildKeyFilter(
  txHashCol: AnyPgColumn,
  logIndexCol: AnyPgColumn,
  keys: { txHash: string; logIndex: number }[],
): SQL {
  return sql`(${txHashCol}, ${logIndexCol}) IN (${sql.join(
    keys.map((k) => sql`(${k.txHash}, ${k.logIndex})`),
    sql.raw(", "),
  )})`;
}
