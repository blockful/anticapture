import { DBToken } from "@/api/mappers";
import { CoingeckoIdToDaoId, CoingeckoTokenId } from "../coingecko/types";
import { DaoIdEnum } from "@/lib/enums";

interface TokensRepository {
  getTokenPropertiesByName(tokenId: DaoIdEnum): Promise<DBToken | null>;
}

export class TokensService {
  constructor(private readonly repo: TokensRepository) {}

  async getTokenPropertiesById(
    tokenId: CoingeckoTokenId,
  ): Promise<DBToken | null> {
    return await this.repo.getTokenPropertiesByName(
      CoingeckoIdToDaoId[tokenId],
    );
  }
}
