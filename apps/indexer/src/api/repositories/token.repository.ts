import { eq } from "drizzle-orm";
import { db } from "ponder:api";
import { token } from "ponder:schema";
import { DBToken } from "../mappers";
import { DaoIdEnum } from "@/lib/enums";

export class TokenRepository {
  async getTokenPropertiesByName(
    tokenName: DaoIdEnum,
  ): Promise<DBToken | null> {
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
      .where(eq(token.name, tokenName));

    return result[0] ?? null;
  }
}
