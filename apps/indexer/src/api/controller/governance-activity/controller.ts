import { DaysEnum } from "@/lib/daysEnum";
import { sql } from "ponder";
import { ponder } from "ponder:registry";
import {
  ActiveSupplyQueryResult,
  AverageTurnoutCompareQueryResult,
  ProposalsCompareQueryResult,
  VotesCompareQueryResult,
} from "./types";
import { convertTimestampMilissecondsToSeconds } from "@/lib/utils";

ponder.get("/dao/:daoId/active-supply", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }
  //Creating Timestamp
  const oldTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);

  //Running Query
  const queryResult = await context.db.execute(sql`
    SELECT COALESCE(SUM(ap."voting_power"), 0) as "activeSupply" FROM "account_power" ap
    WHERE ap."last_vote_timestamp">CAST(${oldTimestamp.toString().slice(0, 10)} as bigint)
    AND ap."dao_id"=${daoId}
  `);

  //Calculating Change Rate
  const activeSupply: ActiveSupplyQueryResult = queryResult
    .rows[0] as ActiveSupplyQueryResult;

  // Returning response
  return context.json(activeSupply);
});

ponder.get("/dao/:daoId/proposals/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }

  //Creating Timestamp
  const oldBeginTimestamp =
    BigInt(Date.now()) -
    BigInt(DaysEnum[days as unknown as DaysEnum]) -
    BigInt(DaysEnum["180d"]);
  const oldEndTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const currentBeginTimestamp = BigInt(Date.now()) - BigInt(DaysEnum["180d"]);

  //Running Query
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

  //Calculating Change Rate
  const proposalsCompare: ProposalsCompareQueryResult = queryResult
    .rows[0] as ProposalsCompareQueryResult;
  let changeRate;
  if (proposalsCompare.oldProposalsLaunched === "0") {
    changeRate = "0";
  } else {
    changeRate =
      parseFloat(proposalsCompare.currentProposalsLaunched) /
        parseFloat(proposalsCompare.oldProposalsLaunched) -
      1;
  }
  // Returning response
  return context.json({ ...proposalsCompare, changeRate });
});

ponder.get("/dao/:daoId/votes/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }

  //Creating Timestamps
  const oldBeginTimestamp =
    BigInt(Date.now()) -
    BigInt(DaysEnum[days as unknown as DaysEnum]) -
    BigInt(DaysEnum["180d"]);
  const oldEndTimestamp =
    BigInt(Date.now()) - BigInt(DaysEnum[days as unknown as DaysEnum]);
  const currentBeginTimestamp = BigInt(Date.now()) - BigInt(DaysEnum["180d"]);

  //Running Query
  const queryResult = await context.db.execute(sql`
        WITH "old_votes" AS (
          SELECT COUNT(*) AS "old_votes" FROM "votes_onchain" v 
          WHERE v.dao_id=${daoId}
          AND v.timestamp 
          BETWEEN CAST(${convertTimestampMilissecondsToSeconds(oldBeginTimestamp)} as bigint) 
          AND CAST(${convertTimestampMilissecondsToSeconds(oldEndTimestamp)} as bigint)
        ),
        "current_votes" AS (
          SELECT COUNT(*) AS "current_votes" FROM "votes_onchain" v
          WHERE v.dao_id=${daoId}
          AND v.timestamp > CAST(${convertTimestampMilissecondsToSeconds(currentBeginTimestamp)} as bigint)
        )
        SELECT "current_votes"."current_votes" as "currentVotes",
        "old_votes"."old_votes" as "oldVotes" 
        FROM "current_votes"
        JOIN "old_votes" ON 1=1;
  `);

  //Calculating Change Rate
  const votesCompare: VotesCompareQueryResult = queryResult
    .rows[0] as VotesCompareQueryResult;
  let changeRate;
  if (votesCompare.oldVotes === "0") {
    changeRate = "0";
  } else {
    changeRate =
      parseFloat(votesCompare.currentVotes) /
        parseFloat(votesCompare.oldVotes) -
      1;
  }
  // Returning response
  return context.json({ ...votesCompare, changeRate });
});

ponder.get("/dao/:daoId/average-turnout/compare", async (context) => {
  //Handling req query and params
  const daoId = context.req.param("daoId");
  const days: string | undefined = context.req.query("days");
  if (!days) {
    throw new Error('Query param "days" is mandatory');
  }

  //Creating Timestamps and Intervals
  const fixedInterval = BigInt(DaysEnum["180d"]);
  const proposalVotingPeriod = BigInt(DaysEnum["7d"]);
  const oldBeginTimestamp =
    BigInt(Date.now()) -
    BigInt(DaysEnum[days as unknown as DaysEnum]) -
    fixedInterval;
  const oldEndTimestamp =
    BigInt(Date.now()) -
    BigInt(DaysEnum[days as unknown as DaysEnum]) -
    proposalVotingPeriod;
  const currentBeginTimestamp = BigInt(Date.now()) - fixedInterval;
  const currentEndTimestamp = BigInt(Date.now()) - proposalVotingPeriod;

  //Running Query
  const queryResult = await context.db.execute(sql`
  with "old_average_turnout" as (
        select AVG(po."for_votes" + po."against_votes" + po."abstain_votes") as "average_turnout"
        from "proposals_onchain" po where po.timestamp 
        BETWEEN CAST(${convertTimestampMilissecondsToSeconds(oldBeginTimestamp)} as bigint)
        and CAST(${convertTimestampMilissecondsToSeconds(oldEndTimestamp)} as bigint)
        AND po.status!='CANCELED' AND po."dao_id"=${daoId}
  ),
  "current_average_turnout" as (
        select AVG(po."for_votes" + po."against_votes" + po."abstain_votes") as "average_turnout"
        from "proposals_onchain" po WHERE po.timestamp
        BETWEEN CAST(${convertTimestampMilissecondsToSeconds(currentBeginTimestamp)} as bigint)
        and CAST(${convertTimestampMilissecondsToSeconds(currentEndTimestamp)} as bigint)
        AND po.status!='CANCELED' AND po."dao_id"=${daoId}
  )
  SELECT "old_average_turnout"."average_turnout" as "oldAverageTurnout",
  "current_average_turnout"."average_turnout" as "currentAverageTurnout" 
  FROM "current_average_turnout" 
  JOIN "old_average_turnout" 
  ON 1=1;
  `);

  //Calculating Change Rate
  const averageTurnoutCompare: AverageTurnoutCompareQueryResult = queryResult
    .rows[0] as AverageTurnoutCompareQueryResult;
  let changeRate;
  if (averageTurnoutCompare.oldAverageTurnout === "0") {
    changeRate = "0";
  } else {
    changeRate =
      parseFloat(averageTurnoutCompare.currentAverageTurnout) /
        parseFloat(averageTurnoutCompare.oldAverageTurnout) -
      1;
  }
  // Returning response
  return context.json({ ...averageTurnoutCompare, changeRate });
});
