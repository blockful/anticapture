import { CoingeckoTokenId } from "../services/coingecko/types";
import { eq } from "drizzle-orm";
import { db } from "ponder:api";
import { token } from "ponder:schema";

export class TokensRepository {
  async getTokenPropertiesById(tokenId: CoingeckoTokenId): Promise<{
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
  } | null> {
    const result = await db
      .select({
        id: token.id,
        name: token.name,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
        delegatedSupply: token.delegatedSupply,
        cexSupply: token.cexSupply,
        dexSupply: token.dexSupply,
        lendingSupply: token.lendingSupply,
        circulatingSupply: token.circulatingSupply,
        treasury: token.treasury,
      })
      .from(token)
      .where(eq(token.id, tokenId));

    return result[0] ?? null;
  }
}
