import { eq } from "drizzle-orm";

import { token } from "ponder:schema";
import { DBToken } from "@/api/mappers";
import { DaoIdEnum } from "@/lib/enums";
import { ReadonlyDrizzle } from "@/api/database";

export class TokenRepository {
  constructor(private readonly db: ReadonlyDrizzle) {}

  async getTokenPropertiesByName(
    tokenName: DaoIdEnum,
  ): Promise<DBToken | null | undefined> {
    return await this.db.query.token.findFirst({
      where: eq(token.name, tokenName),
    });
  }
}
