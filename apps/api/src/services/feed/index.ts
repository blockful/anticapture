import { z } from "zod";

import {
  FeedEventType,
  FeedRelevance,
  FeedRelevanceFilter,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import {
  DBFeedEvent,
  FeedMetadataSchema,
  FeedRequest,
  FeedResponse,
} from "@/mappers";

type FeedEventWithMetadata = DBFeedEvent & {
  metadata: z.infer<typeof FeedMetadataSchema> | null;
};

interface FeedRepository {
  getFeedEvents(
    req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ): Promise<{
    items: FeedEventWithMetadata[];
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
      req.relevance ?? FeedRelevanceFilter.MEDIUM,
    );
    const response = await this.repo.getFeedEvents(req, valueThresholds);
    return {
      items: response.items.map((item) => ({
        ...item,
        value:
          item.type === FeedEventType.PROPOSAL ||
          item.type === FeedEventType.PROPOSAL_EXTENDED
            ? undefined
            : item.value.toString(),
        relevance: this.getItemRelevance(item),
        type: item.type as FeedEventType,
      })),
      totalCount: response.totalCount,
    };
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
    relevance: FeedRelevanceFilter,
  ): Partial<Record<FeedEventType, bigint>> {
    const daoThresholds = getDaoRelevanceThreshold(this.daoId);
    const result: Partial<Record<FeedEventType, bigint>> = {};

    for (const [type, levels] of Object.entries(daoThresholds)) {
      // ALL keeps an entry per type with a zero floor rather than returning an
      // empty map: the repository derives which types to match from these keys,
      // so dropping them would also drop the `type` filter.
      result[type as FeedEventType] =
        relevance === FeedRelevanceFilter.ALL ? 0n : levels[relevance];
    }

    return result;
  }
}
