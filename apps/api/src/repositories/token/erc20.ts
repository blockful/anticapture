import { eq } from "drizzle-orm";

import { Drizzle, token } from "@/database";
import { DaoIdEnum } from "@/lib/enums";
import { DBToken } from "@/mappers";

export class TokenRepository {
  constructor(private readonly db: Drizzle) {}

  async getTokenPropertiesByName(
    tokenName: DaoIdEnum,
  ): Promise<DBToken | null | undefined> {
    return await this.db.query.token.findFirst({
      where: eq(token.name, tokenName),
    });
  }
}
