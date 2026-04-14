import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { DBFeedEvent, FeedRequest, FeedResponse } from "@/mappers";
import type { DBFeedEventWithMetadata } from "@/repositories/feed";

interface FeedRepository {
  getFeedEvents(
    req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ): Promise<{
    items: DBFeedEventWithMetadata[];
    totalCount: number;
  }>;
}

export class FeedService {
  constructor(
    private readonly daoId: DaoIdEnum,
    private readonly repo: FeedRepository,
  ) {}

  async getFeedEvents(req: FeedRequest): Promise<FeedResponse> {
    const valueThresholds = this.getValueThresholds(
      req.relevance ?? FeedRelevance.MEDIUM,
    );
    const response = await this.repo.getFeedEvents(req, valueThresholds);
    return {
      items: response.items.map((item) => this.mapFeedItem(item)),
      totalCount: response.totalCount,
    };
  }

  private mapFeedItem(
    item: DBFeedEventWithMetadata,
  ): FeedResponse["items"][number] {
    const relevance = this.getItemRelevance(item);

    switch (item.type) {
      case FeedEventType.VOTE:
      case FeedEventType.DELEGATION:
      case FeedEventType.TRANSFER:
        return {
          ...item,
          value: item.value.toString(),
          relevance,
        };
      case FeedEventType.PROPOSAL:
      case FeedEventType.PROPOSAL_EXTENDED:
        return {
          ...item,
          value: undefined,
          relevance,
        };
    }
  }

  private getItemRelevance(item: DBFeedEvent): FeedRelevance {
    const daoThresholds = getDaoRelevanceThreshold(this.daoId);
    const typeThresholds =
      daoThresholds[item.type as keyof typeof daoThresholds];

    if (!typeThresholds) {
      return FeedRelevance.HIGH;
    }

    if (item.value >= typeThresholds[FeedRelevance.HIGH]) {
      return FeedRelevance.HIGH;
    }
    if (item.value >= typeThresholds[FeedRelevance.MEDIUM]) {
      return FeedRelevance.MEDIUM;
    }
    return FeedRelevance.LOW;
  }

  private getValueThresholds(
    relevance: FeedRelevance,
  ): Partial<Record<FeedEventType, bigint>> {
    const daoThresholds = getDaoRelevanceThreshold(this.daoId);
    const result: Partial<Record<FeedEventType, bigint>> = {};

    for (const [type, levels] of Object.entries(daoThresholds)) {
      result[type as FeedEventType] = levels[relevance];
    }

    return result;
  }
}
