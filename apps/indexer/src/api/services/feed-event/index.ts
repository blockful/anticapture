import {
  FeedEventRequest,
  FeedEventListResponse,
  FeedEventMapper,
  DBFeedEvent,
} from "@/api/mappers";

interface FeedEventRepository {
  getFeedEventsCount(req: FeedEventRequest): Promise<number>;
  getFeedEvents(req: FeedEventRequest): Promise<DBFeedEvent[]>;
}

export class FeedEventService {
  constructor(private feedEventRepository: FeedEventRepository) {}

  async getFeedEvents(
    params: FeedEventRequest,
  ): Promise<FeedEventListResponse> {
    const [totalCount, events] = await Promise.all([
      this.feedEventRepository.getFeedEventsCount(params),
      this.feedEventRepository.getFeedEvents(params),
    ]);

    return {
      items: events.map(FeedEventMapper.toApi),
      totalCount,
    };
  }
}
