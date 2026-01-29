import { DBToken } from "@/mappers";
import { DaoIdEnum } from "@/lib/enums";

interface TokenRepository {

constructor(private readonly db: Drizzle) {}

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
