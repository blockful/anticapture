import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { Address } from "viem";

import { delegation, Drizzle, transfer, votingPowerHistory } from "@/database";
import { DBHistoricalVotingPowerWithRelations } from "@/mappers";

type HistoricalVotingPowerOrderBy = "timestamp" | "delta";
type HistoricalVotingPowerOrderDirection = "asc" | "desc";
type TransferRelation = "previous" | "next";

type HistoricalVotingPowerQuery = {
  skip: number;
  limit: number;
  orderDirection: HistoricalVotingPowerOrderDirection;
  orderBy: HistoricalVotingPowerOrderBy;
  accountId?: Address;
  minDelta?: string;
  maxDelta?: string;
  fromDate?: number;
  toDate?: number;
  includeSameLogIndex?: boolean;
  transferRelation?: TransferRelation;
};

export const getHistoricalVotingPowersWithRelations = async (
  db: Drizzle,
  {
    skip,
    limit,
    orderDirection,
    orderBy,
    accountId,
    minDelta,
    maxDelta,
    fromDate,
    toDate,
    includeSameLogIndex = false,
    transferRelation = "previous",
  }: HistoricalVotingPowerQuery,
): Promise<DBHistoricalVotingPowerWithRelations[]> => {
  const historyPage = db
    .select({
      transactionHash: votingPowerHistory.transactionHash,
      daoId: votingPowerHistory.daoId,
      accountId: votingPowerHistory.accountId,
      votingPower: votingPowerHistory.votingPower,
      delta: votingPowerHistory.delta,
      deltaMod: votingPowerHistory.deltaMod,
      timestamp: votingPowerHistory.timestamp,
      logIndex: votingPowerHistory.logIndex,
    })
    .from(votingPowerHistory)
    .where(
      and(
        accountId ? eq(votingPowerHistory.accountId, accountId) : undefined,
        minDelta
          ? gte(votingPowerHistory.deltaMod, BigInt(minDelta))
          : undefined,
        maxDelta
          ? lte(votingPowerHistory.deltaMod, BigInt(maxDelta))
          : undefined,
        fromDate
          ? gte(votingPowerHistory.timestamp, BigInt(fromDate))
          : undefined,
        toDate ? lte(votingPowerHistory.timestamp, BigInt(toDate)) : undefined,
      ),
    )
    .orderBy(
      orderDirection === "asc"
        ? asc(
            orderBy === "timestamp"
              ? votingPowerHistory.timestamp
              : votingPowerHistory.deltaMod,
          )
        : desc(
            orderBy === "timestamp"
              ? votingPowerHistory.timestamp
              : votingPowerHistory.deltaMod,
          ),
    )
    .limit(limit)
    .offset(skip)
    .as("history_page");

  const delegationLogIndexCondition = includeSameLogIndex
    ? sql`d2.log_index <= ${historyPage.logIndex}`
    : sql`d2.log_index < ${historyPage.logIndex}`;
  const previousTransferLogIndexCondition = includeSameLogIndex
    ? sql`t2.log_index <= ${historyPage.logIndex}`
    : sql`t2.log_index < ${historyPage.logIndex}`;
  const transferJoinCondition =
    transferRelation === "next"
      ? sql`${historyPage.transactionHash} = ${transfer.transactionHash}
          AND ${transfer.logIndex} = (
            SELECT MIN(t2.log_index)
            FROM ${transfer} t2
            WHERE t2.transaction_hash = ${historyPage.transactionHash}
            AND t2.log_index > ${historyPage.logIndex}
        )`
      : sql`${historyPage.transactionHash} = ${transfer.transactionHash}
          AND ${transfer.logIndex} = (
            SELECT MAX(t2.log_index)
            FROM ${transfer} t2
            WHERE t2.transaction_hash = ${historyPage.transactionHash}
            AND ${previousTransferLogIndexCondition}
        )`;

  const result = await db
    .select({
      history: {
        transactionHash: historyPage.transactionHash,
        daoId: historyPage.daoId,
        accountId: historyPage.accountId,
        votingPower: historyPage.votingPower,
        delta: historyPage.delta,
        deltaMod: historyPage.deltaMod,
        timestamp: historyPage.timestamp,
        logIndex: historyPage.logIndex,
      },
      delegations: delegation,
      transfers: transfer,
    })
    .from(historyPage)
    .leftJoin(
      delegation,
      sql`${historyPage.transactionHash} = ${delegation.transactionHash}
          AND ${delegation.logIndex} = (
            SELECT MAX(d2.log_index)
            FROM ${delegation} d2
            WHERE d2.transaction_hash = ${historyPage.transactionHash}
            AND ${delegationLogIndexCondition}
        )`,
    )
    .leftJoin(transfer, transferJoinCondition);

  return result.map((row) => ({
    ...row.history,
    delegations:
      row.transfers &&
      (transferRelation === "next"
        ? row.transfers.logIndex < (row.delegations?.logIndex || 0)
        : row.transfers.logIndex > (row.delegations?.logIndex || 0))
        ? null
        : row.delegations,
    transfers:
      row.delegations &&
      row.delegations.logIndex > (row.transfers?.logIndex || 0)
        ? null
        : row.transfers,
  }));
};
