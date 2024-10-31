import { ponder } from "@/generated";
import { and, eq, inArray, sum } from "@ponder/core";
import _ from "lodash";

ponder.get("/voting-power/total-supply/delegated", async (c) => {
  const daoId = c.req.query("dao");
  if (!daoId) {
    //TODO: the correct returnal is c.status(400).json({error: "Bad request - dao is mandatory"}), but it is not working
    //source: https://ponder.sh/docs/query/api-functions#get:~:text=return%20c.status(404).json(%7B%20error%3A%20%22Account%20not%20found%22%20%7D)%3B
    throw new Error("Bad request - dao is mandatory");
  }
  const { Delegations, AccountPower } = c.tables;
  // _.uniqBy function is to select distinct delegatees, since this version of drizzle db doesn't have selectDistinct function,
  // The map is to have an array of addresses, instead of a collection of objects with delegatee inside
  const daoDelegatees = _.uniqBy(
    await c.db
      .select({ delegatee: Delegations.delegatee })
      .from(Delegations)
      .where(eq(Delegations.dao, daoId))
      .execute(),
    "delegatee"
  ).map(({ delegatee }) => delegatee);

  const daoDelegatedVotingSupply = c.db
    .select({ votingPower: sum(AccountPower.votingPower) })
    .from(AccountPower)
    .where(
      and(
        inArray(AccountPower.account, daoDelegatees),
        eq(AccountPower.dao, daoId)
      )
    )
    .execute();
  return c.json({ dao: daoId, daoDelegatedVotingSupply });
});

