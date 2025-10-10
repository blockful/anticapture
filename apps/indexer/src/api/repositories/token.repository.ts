import { eq } from "drizzle-orm";
import { db } from "ponder:api";
import { token } from "ponder:schema";
import { DBToken } from "../mappers";
import { DaoIdEnum } from "@/lib/enums";

export class TokenRepository {
  async getTokenPropertiesByName(
    tokenName: DaoIdEnum,
  ): Promise<DBToken | null | undefined> {
    return await db.query.token.findFirst({
      where: eq(token.name, tokenName),
    });
  }
}
