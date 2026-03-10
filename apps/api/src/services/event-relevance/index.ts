import { FeedEventType, FeedRelevance } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { getDaoRelevanceThreshold } from "@/lib/eventRelevance";

export class EventRelevanceService {
  constructor(private readonly daoId: DaoIdEnum) {}

  getThreshold(type: FeedEventType, relevance: FeedRelevance): string {
    const daoThresholds = getDaoRelevanceThreshold(this.daoId);
    return daoThresholds[type][relevance].toString();
  }
}
