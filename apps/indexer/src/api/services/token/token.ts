import { DBToken } from "@/api/mappers";
import { DaoIdEnum } from "@/lib/enums";

interface TokenRepository {
  getTokenPropertiesByName(
    tokenId: DaoIdEnum,
  ): Promise<DBToken | null | undefined>;
}

export class TokenService {
  constructor(private readonly repo: TokenRepository) {}

  async getTokenProperties(
    daoId: DaoIdEnum,
  ): Promise<DBToken | null | undefined> {
    return await this.repo.getTokenPropertiesByName(daoId);
  }
}
