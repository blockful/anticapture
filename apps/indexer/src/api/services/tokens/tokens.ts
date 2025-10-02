import { DBToken } from "@/api/mappers";
import { CoingeckoTokenId } from "../coingecko/types";

interface TokensRepository {
  getTokenPropertiesById(tokenId: CoingeckoTokenId): Promise<DBToken | null>;
}

export class TokensService {
  constructor(private readonly repo: TokensRepository) {}

  async getTokenPropertiesById(
    tokenId: CoingeckoTokenId,
  ): Promise<DBToken | null> {
    return await this.repo.getTokenPropertiesById(tokenId);
  }
}
