import { DaoIdEnum } from "@/lib/enums";
import { DBFeedEvent, FeedRequest, FeedResponse } from "@/mappers";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";
import { FeedEventType, FeedRelevance } from "@/lib/constants";

interface FeedRepository {
  getFeedEvents(
    req: FeedRequest,
    valueThresholds: Partial<Record<FeedEventType, bigint>>,
  ): Promise<{
    items: DBFeedEvent[];
    totalCount: number;
  }>;
}

export class FeedService {
  constructor(
    private readonly daoId: DaoIdEnum,
    private readonly repo: FeedRepository,
  ) {}

  async getFeedEvents(req: FeedRequest): Promise<FeedResponse> {
    const valueThresholds = this.getValueThresholds(req.relevance);
    const response = await this.repo.getFeedEvents(req, valueThresholds);
    return {
      items: response.items.map((item) => ({
        ...item,
        value: item.value.toString(),
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
