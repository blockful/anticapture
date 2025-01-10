import { DaysEnum } from "@/lib/daysEnum";
import { sql } from "ponder";
import { ponder } from "ponder:registry";
import {
  ActiveSupplyQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "./types";
import { formatUnits } from "viem";

ponder.get("/dao/:daoId/active-supply", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const queryResult = await context.db.execute(sql`
            WITH  "active_users" as (
          SELECT DISTINCT ON (voc."voter_account_id") voc."voter_account_id", voc.timestamp
          FROM "votes_onchain" voc WHERE voc.timestamp>CAST(${oldTimestamp.toString().slice(0, 10)} as bigint)
          AND voc."dao_id" = ${daoId}
          ORDER BY voc."voter_account_id", voc.timestamp DESC
        )
        SELECT COALESCE(SUM(ap."voting_power"), 0) as "activeSupply", TEXT(COUNT("active_users".*)) AS "activeUsers" FROM "account_power" ap
        JOIN "active_users" ON ap."account_id" = "active_users"."voter_account_id";
    `);
  const activeSupply: ActiveSupplyQueryResult = queryResult
    .rows[0] as ActiveSupplyQueryResult;
  return context.json(activeSupply);
});

ponder.get("/dao/:daoId/proposals/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldBeginTimestamp =
    BigInt(Date.now()) -
    BigInt(DaysEnum[days as unknown as DaysEnum]) -
    BigInt(DaysEnum["180d"]);
  const oldEndTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const currentBeginTimestamp = BigInt(Date.now()) - BigInt(DaysEnum["180d"]);
  const queryResult = await context.db.execute(sql`
        WITH "old_proposals" AS (
          SELECT COUNT(*) AS "old_proposals_launched" FROM "proposals_onchain" p 
          WHERE p.dao_id=${daoId}
          AND p.timestamp BETWEEN CAST(${oldBeginTimestamp.toString().slice(0, 10)} as bigint) AND CAST(${oldEndTimestamp.toString().slice(0, 10)} as bigint)
        ),
        "current_proposals" AS (
          SELECT COUNT(*) AS "current_proposals_launched" FROM "proposals_onchain" p
          WHERE p.dao_id=${daoId}
          AND p.timestamp > CAST(${currentBeginTimestamp.toString().slice(0, 10)} as bigint)
        )
        SELECT "current_proposals"."current_proposals_launched" as "currentProposalsLaunched",
        "old_proposals"."old_proposals_launched" as "oldProposalsLaunched" 
        FROM "current_proposals"
        JOIN "old_proposals" ON 1=1;
  `);
  const proposalsCompare: ProposalsCompareQueryResult = queryResult
    .rows[0] as ProposalsCompareQueryResult;
  let changeRate;
  if (proposalsCompare.oldProposalsLaunched === "0") {
    changeRate = "0";
  } else {
    changeRate =
      parseFloat(proposalsCompare.currentProposalsLaunched) /
      parseFloat(proposalsCompare.oldProposalsLaunched);
  }
  return context.json({ ...proposalsCompare, changeRate });
});

ponder.get("/dao/:daoId/votes/compare", async (context) => {
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  const oldBeginTimestamp =
    BigInt(Date.now()) -
    BigInt(DaysEnum[days as unknown as DaysEnum]) -
    BigInt(DaysEnum["180d"]);
  const oldEndTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const currentBeginTimestamp = BigInt(Date.now()) - BigInt(DaysEnum["180d"]);
  const queryResult = await context.db.execute(sql`
        WITH "old_votes" AS (
          SELECT COUNT(*) AS "old_votes" FROM "votes_onchain" v 
          WHERE v.dao_id=${daoId}
          AND v.timestamp BETWEEN CAST(${oldBeginTimestamp.toString().slice(0, 10)} as bigint) AND CAST(${oldEndTimestamp.toString().slice(0, 10)} as bigint)
        ),
        "current_votes" AS (
          SELECT COUNT(*) AS "current_votes" FROM "votes_onchain" v
          WHERE v.dao_id=${daoId}
          AND v.timestamp > CAST(${currentBeginTimestamp.toString().slice(0, 10)} as bigint)
        )
        SELECT "current_votes"."current_votes" as "currentVotes",
        "old_votes"."old_votes" as "oldVotes" 
        FROM "current_votes"
        JOIN "old_votes" ON 1=1;
  `);
  const votesCompare: VotesCompareQueryResult = queryResult
    .rows[0] as VotesCompareQueryResult;
  let changeRate;
  if (votesCompare.oldVotes === "0") {
    changeRate = "0";
  } else {
    changeRate =
      parseFloat(votesCompare.currentVotes) / parseFloat(votesCompare.oldVotes);
  }
  return context.json({ ...votesCompare, changeRate });
});
