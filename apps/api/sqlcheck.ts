Object.defineProperty(BigInt.prototype, "toJSON", {
  value: function (this: bigint) {
    return this.toString();
  },
  writable: true,
  configurable: true,
});

import { sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

import { proposalsOnchain, votingPowerHistory } from "./src/database/schema";
import * as schema from "./src/database/schema";

const client = new PGlite();
const db = drizzle(client, { schema });

const built = db
  .select({
    id: proposalsOnchain.id,
    proposerAccountId: proposalsOnchain.proposerAccountId,
    title: proposalsOnchain.title,
    endBlock: proposalsOnchain.endBlock,
    endTimestamp: proposalsOnchain.endTimestamp,
    proposerVotingPower: sql<string | null>`(
      SELECT ${votingPowerHistory.votingPower}::text
      FROM ${votingPowerHistory}
      WHERE ${votingPowerHistory.accountId} = ${proposalsOnchain.proposerAccountId}
        AND ${votingPowerHistory.timestamp} <= ${proposalsOnchain.timestamp}
      ORDER BY ${votingPowerHistory.timestamp} DESC
      LIMIT 1
    )`,
  })
  .from(proposalsOnchain)
  .where(inArray(proposalsOnchain.id, ["42"]));

console.log(built.toSQL().sql);
