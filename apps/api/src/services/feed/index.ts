import { DBFeedEvent, FeedRequest } from "@/mappers";

interface FeedRepository {
  getFeedEvents(
    req: FeedRequest,
  ): Promise<{ items: DBFeedEvent[]; totalCount: number }>;
}

export class FeedService {
  constructor(private readonly repo: FeedRepository) {}

  async getFeedEvents(
    req: FeedRequest,
  ): Promise<{ items: DBFeedEvent[]; totalCount: number }> {
    return await this.repo.getFeedEvents(req);
  }
}
