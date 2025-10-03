import { DBToken } from "@/api/mappers";
import { CoingeckoIdToDaoId, CoingeckoTokenId } from "../coingecko/types";
import { DaoIdEnum } from "@/lib/enums";

interface TokenRepository {
  getTokenPropertiesByName(tokenId: DaoIdEnum): Promise<DBToken | null>;
}

export class TokenService {
  constructor(private readonly repo: TokenRepository) {}

  async getTokenProperties(tokenId: CoingeckoTokenId): Promise<DBToken | null> {
    return await this.repo.getTokenPropertiesByName(
      CoingeckoIdToDaoId[tokenId],
    );
  }
}
