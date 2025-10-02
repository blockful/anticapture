import { CoingeckoTokenId } from "../coingecko/types";

interface TokensRepository {
  getTokenPropertiesById(tokenId: CoingeckoTokenId): Promise<{
    id: string;
    name: string | null;
    decimals: number;
    totalSupply: bigint;
    delegatedSupply: bigint;
    cexSupply: bigint;
    dexSupply: bigint;
    lendingSupply: bigint;
    circulatingSupply: bigint;
    treasury: bigint;
  }>;
}

export class TokensService {
  constructor(private readonly repo: TokensRepository) {}

  async getTokenPropertiesById(tokenId: CoingeckoTokenId) {
    const result = this.repo.getTokenPropertiesById(tokenId);
    if (result === null) {
      throw "err";
    }
    return result;
  }
}
