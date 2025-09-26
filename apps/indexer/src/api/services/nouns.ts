import { TokenValueResponseType } from "../mappers";

interface Repository {
  getHistoricalTokenData(
    days: number,
    window: number,
  ): Promise<
    {
      timestamp: number;
      price: number;
    }[]
  >;
}

export class NounsService {
  constructor(private readonly repository: Repository) {}

  async getHistoricalTokenData(days: number): Promise<TokenValueResponseType> {
    // 30 days window to average nouns price ignoring spikes
    const prices = await this.repository.getHistoricalTokenData(days, 30);

    return {
      items: prices,
    };
  }
}
