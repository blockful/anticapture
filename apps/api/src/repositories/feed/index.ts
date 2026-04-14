import { and, asc, desc, eq, gte, inArray, lte, or, SQL } from "drizzle-orm";

import {
  delegation,
  feedEvent,
  proposalsOnchain,
  ReadonlyDrizzle,
  transfer,
  votesOnchain,
  votingPowerHistory,
} from "@/database";
import { FeedEventType } from "@/lib/constants";
import {
  DBFeedEvent,
  FeedItemMetadata,
  FeedItemMetadataByType,
  FeedRequest,
  VoteFeedMetadataSchema,
  DelegationFeedMetadataSchema,
  TransferFeedMetadataSchema,
  ProposalFeedMetadataSchema,
  ProposalExtendedFeedMetadataSchema,
} from "@/mappers";

export type DBFeedEventWithMetadata = Omit<DBFeedEvent, "type"> &
  FeedItemMetadataByType;

export class FeedRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getFeedEvents(
    req: FeedRequest,
    valueThresholds: Record<FeedEventType, bigint>,
  ): Promise<{
    items: DBFeedEventWithMetadata[];
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

    const [items, totalCount] = await Promise.all([
      this.db.query.feedEvent.findMany({
        where,
        orderBy: orderByFn,
        offset: skip,
        limit,
      }),
      this.db.$count(feedEvent, where),
    ]);

    const itemsWithMetadata = await this.buildMetadata(items);

    return {
      items: itemsWithMetadata,
      totalCount,
    };
  }

  private async buildMetadata(
    items: DBFeedEvent[],
  ): Promise<DBFeedEventWithMetadata[]> {
    if (items.length === 0) {
      return [];
    }

    const voteMetadata = await this.getVoteMetadata(items);
    const delegationMetadata = await this.getDelegationMetadata(items);
    const transferMetadata = await this.getTransferMetadata(items);
    const proposalMetadata = await this.getProposalMetadata(items);
    const proposalExtendedMetadata =
      await this.getProposalExtendedMetadata(items);

    return items.map((item) => {
      const key = this.getEventKey(item);
      const metadata =
        voteMetadata.get(key) ??
        delegationMetadata.get(key) ??
        transferMetadata.get(key) ??
        proposalMetadata.get(key) ??
        proposalExtendedMetadata.get(key);

      if (!metadata) {
        throw new Error(
          `Missing feed metadata for ${item.type} event ${item.txHash}:${item.logIndex}`,
        );
      }

      return this.attachMetadata(item, metadata);
    });
  }

  private attachMetadata(
    item: DBFeedEvent,
    metadata: FeedItemMetadata,
  ): DBFeedEventWithMetadata {
    switch (item.type) {
      case FeedEventType.VOTE:
        return {
          ...item,
          type: FeedEventType.VOTE,
          metadata: VoteFeedMetadataSchema.parse(metadata),
        };
      case FeedEventType.DELEGATION:
        return {
          ...item,
          type: FeedEventType.DELEGATION,
          metadata: DelegationFeedMetadataSchema.parse(metadata),
        };
      case FeedEventType.TRANSFER:
        return {
          ...item,
          type: FeedEventType.TRANSFER,
          metadata: TransferFeedMetadataSchema.parse(metadata),
        };
      case FeedEventType.PROPOSAL:
        return {
          ...item,
          type: FeedEventType.PROPOSAL,
          metadata: ProposalFeedMetadataSchema.parse(metadata),
        };
      case FeedEventType.PROPOSAL_EXTENDED:
        return {
          ...item,
          type: FeedEventType.PROPOSAL_EXTENDED,
          metadata: ProposalExtendedFeedMetadataSchema.parse(metadata),
        };
      default:
        throw new Error(
          `Unsupported feed event type ${item.type} for ${item.txHash}:${item.logIndex}`,
        );
    }
  }

  private async getVoteMetadata(
    items: DBFeedEvent[],
  ): Promise<Map<string, FeedItemMetadata>> {
    const voteItems = items.filter((item) => item.type === FeedEventType.VOTE);
    if (voteItems.length === 0) {
      return new Map();
    }

    const rows = await this.db.query.votesOnchain.findMany({
      where: inArray(
        votesOnchain.txHash,
        this.unique(voteItems.map((item) => item.txHash)),
      ),
      with: {
        proposal: {
          columns: {
            title: true,
          },
        },
      },
    });

    const rowsByTxHash = new Map(rows.map((row) => [row.txHash, row]));
    return new Map(
      voteItems.map((item) => {
        const row = rowsByTxHash.get(item.txHash);
        if (!row) {
          throw new Error(
            `Missing vote row for ${item.type} event ${item.txHash}:${item.logIndex}`,
          );
        }

        return [
          this.getEventKey(item),
          {
            voter: row.voterAccountId,
            reason: row.reason,
            support: Number(row.support),
            votingPower: row.votingPower.toString(),
            proposalId: row.proposalId,
            title: row.proposal?.title ?? null,
          },
        ];
      }),
    );
  }

  private async getDelegationMetadata(
    items: DBFeedEvent[],
  ): Promise<Map<string, FeedItemMetadata>> {
    const delegationItems = items.filter(
      (item) => item.type === FeedEventType.DELEGATION,
    );
    if (delegationItems.length === 0) {
      return new Map();
    }

    const rows = await this.db.query.delegation.findMany({
      where: inArray(
        delegation.transactionHash,
        this.unique(delegationItems.map((item) => item.txHash)),
      ),
    });
    const rowsByEventKey = new Map(
      rows.map((row) => [this.getKey(row.transactionHash, row.logIndex), row]),
    );

    return new Map(
      delegationItems.map((item) => {
        const row = rowsByEventKey.get(this.getEventKey(item));
        if (!row) {
          throw new Error(
            `Missing delegation row for ${item.type} event ${item.txHash}:${item.logIndex}`,
          );
        }

        return [
          this.getEventKey(item),
          {
            delegator: row.delegatorAccountId,
            delegate: row.delegateAccountId,
            previousDelegate: row.previousDelegate,
            amount: row.delegatedValue.toString(),
          },
        ];
      }),
    );
  }

  private async getTransferMetadata(
    items: DBFeedEvent[],
  ): Promise<Map<string, FeedItemMetadata>> {
    const transferItems = items.filter(
      (item) => item.type === FeedEventType.TRANSFER,
    );
    if (transferItems.length === 0) {
      return new Map();
    }

    const rows = await this.db.query.transfer.findMany({
      where: inArray(
        transfer.transactionHash,
        this.unique(transferItems.map((item) => item.txHash)),
      ),
    });
    const rowsByEventKey = new Map(
      rows.map((row) => [this.getKey(row.transactionHash, row.logIndex), row]),
    );

    return new Map(
      transferItems.map((item) => {
        const row = rowsByEventKey.get(this.getEventKey(item));
        if (!row) {
          throw new Error(
            `Missing transfer row for ${item.type} event ${item.txHash}:${item.logIndex}`,
          );
        }

        return [
          this.getEventKey(item),
          {
            from: row.fromAccountId,
            to: row.toAccountId,
            amount: row.amount.toString(),
          },
        ];
      }),
    );
  }

  private async getProposalMetadata(
    items: DBFeedEvent[],
  ): Promise<Map<string, FeedItemMetadata>> {
    const proposalItems = items.filter(
      (item) => item.type === FeedEventType.PROPOSAL,
    );
    if (proposalItems.length === 0) {
      return new Map();
    }

    const proposals = await this.getProposals(proposalItems);
    const proposerPowers = await this.getProposerPowersByProposal(proposals);

    return new Map(
      proposalItems.map((item) => {
        const proposal = this.getProposalForItem(proposals, item);
        if (!proposal) {
          throw new Error(
            `Missing proposal row for ${item.type} event ${item.txHash}:${item.logIndex}`,
          );
        }

        return [
          this.getEventKey(item),
          {
            id: proposal.id,
            proposer: proposal.proposerAccountId,
            votingPower:
              proposerPowers
                .get(this.getProposalPowerKey(proposal))
                ?.toString() ?? "0",
            title: proposal.title,
          },
        ];
      }),
    );
  }

  private async getProposalExtendedMetadata(
    items: DBFeedEvent[],
  ): Promise<Map<string, FeedItemMetadata>> {
    const proposalExtendedItems = items.filter(
      (item) => item.type === FeedEventType.PROPOSAL_EXTENDED,
    );
    if (proposalExtendedItems.length === 0) {
      return new Map();
    }

    const proposals = await this.getProposals(proposalExtendedItems);
    return new Map(
      proposalExtendedItems.map((item) => {
        const proposal = this.getProposalForItem(proposals, item);
        if (!proposal) {
          throw new Error(
            `Missing proposal row for ${item.type} event ${item.txHash}:${item.logIndex}`,
          );
        }

        return [
          this.getEventKey(item),
          {
            id: proposal.id,
            title: proposal.title,
            endBlock: proposal.endBlock,
            endTimestamp: proposal.endTimestamp.toString(),
            proposer: proposal.proposerAccountId,
          },
        ];
      }),
    );
  }

  private async getProposals(
    proposalItems: DBFeedEvent[],
  ): Promise<Map<string, typeof proposalsOnchain.$inferSelect>> {
    const proposalIds = this.unique(
      proposalItems
        .filter((item) => item.value !== 0n)
        .map((item) => item.value.toString()),
    );
    const txHashes = this.unique(proposalItems.map((item) => item.txHash));

    const rows = await this.db.query.proposalsOnchain.findMany({
      where: or(
        proposalIds.length > 0
          ? inArray(proposalsOnchain.id, proposalIds)
          : undefined,
        txHashes.length > 0
          ? inArray(proposalsOnchain.txHash, txHashes)
          : undefined,
      ),
    });

    return new Map([
      ...rows.map((row) => [this.getProposalIdKey(row.id), row] as const),
      ...rows.map((row) => [this.getProposalTxKey(row.txHash), row] as const),
    ]);
  }

  private getProposalForItem(
    proposals: Map<string, typeof proposalsOnchain.$inferSelect>,
    item: DBFeedEvent,
  ): typeof proposalsOnchain.$inferSelect | undefined {
    if (item.value !== 0n) {
      const proposal = proposals.get(
        this.getProposalIdKey(item.value.toString()),
      );
      if (proposal) {
        return proposal;
      }
    }

    return proposals.get(this.getProposalTxKey(item.txHash));
  }

  private getProposalIdKey(id: string): string {
    return `id:${id}`;
  }

  private getProposalTxKey(txHash: string): string {
    return `tx:${txHash}`;
  }

  private async getProposerPowersByProposal(
    proposals: Map<string, typeof proposalsOnchain.$inferSelect>,
  ): Promise<Map<string, bigint>> {
    const uniqueProposals = this.uniqueBy(
      Array.from(proposals.values()),
      (proposal) => proposal.id,
    );
    const proposerIds = this.unique(
      uniqueProposals.map((proposal) => proposal.proposerAccountId),
    );
    const daoIds = this.unique(
      uniqueProposals.map((proposal) => proposal.daoId),
    );
    if (proposerIds.length === 0 || daoIds.length === 0) {
      return new Map();
    }

    const maxProposalTimestamp = uniqueProposals.reduce(
      (max, proposal) => (proposal.timestamp > max ? proposal.timestamp : max),
      0n,
    );

    const rows = await this.db.query.votingPowerHistory.findMany({
      where: and(
        inArray(votingPowerHistory.accountId, proposerIds),
        inArray(votingPowerHistory.daoId, daoIds),
        lte(votingPowerHistory.timestamp, maxProposalTimestamp),
      ),
      orderBy: [
        desc(votingPowerHistory.timestamp),
        desc(votingPowerHistory.logIndex),
      ],
    });

    return new Map(
      uniqueProposals.map((proposal) => {
        const historicalPower = rows.find(
          (row) =>
            row.accountId === proposal.proposerAccountId &&
            row.daoId === proposal.daoId &&
            row.timestamp <= proposal.timestamp,
        );

        return [
          this.getProposalPowerKey(proposal),
          historicalPower?.votingPower ?? 0n,
        ];
      }),
    );
  }

  private getProposalPowerKey(
    proposal: typeof proposalsOnchain.$inferSelect,
  ): string {
    return `${proposal.daoId}:${proposal.id}`;
  }

  private unique<T>(values: T[]): T[] {
    return Array.from(new Set(values));
  }

  private uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
    const seen = new Set<string>();
    return values.filter((value) => {
      const key = getKey(value);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getEventKey(item: DBFeedEvent): string {
    return this.getKey(item.txHash, item.logIndex);
  }

  private getKey(txHash: string, logIndex: number): string {
    return `${txHash}:${logIndex}`;
  }

  private buildRelevanceFilter(
    type: FeedEventType | undefined,
    valueThresholds: Record<FeedEventType, bigint>,
  ): SQL | undefined {
    const conditions: SQL[] = [];

    if (type) {
      conditions.push(
        this.buildRelevanceCondition(type, valueThresholds[type]),
      );
    } else {
      // No type filter - build per-type conditions with OR
      for (const [eventType, minValue] of Object.entries(valueThresholds)) {
        conditions.push(
          this.buildRelevanceCondition(eventType as FeedEventType, minValue),
        );
      }
    }

    return conditions.length > 0 ? or(...conditions) : undefined;
  }

  private buildRelevanceCondition(type: FeedEventType, minValue: bigint): SQL {
    if (
      type === FeedEventType.PROPOSAL ||
      type === FeedEventType.PROPOSAL_EXTENDED
    ) {
      return eq(feedEvent.type, type);
    }

    return and(eq(feedEvent.type, type), gte(feedEvent.value, minValue))!;
  }
}
