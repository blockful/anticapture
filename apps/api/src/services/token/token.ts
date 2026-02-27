import { DaoIdEnum } from "@/lib/enums";
import { DBToken } from "@/mappers";

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
