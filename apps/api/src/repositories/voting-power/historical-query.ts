import { and, asc, desc, eq, gt, gte, lt, lte, or, sql } from "drizzle-orm";
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

  const relatedDelegation = db
    .select()
    .from(delegation)
    .where(
      and(
        eq(delegation.transactionHash, historyPage.transactionHash),
        includeSameLogIndex
          ? lte(delegation.logIndex, historyPage.logIndex)
          : lt(delegation.logIndex, historyPage.logIndex),
        or(
          eq(delegation.delegateAccountId, historyPage.accountId),
          eq(delegation.previousDelegate, historyPage.accountId),
        ),
      ),
    )
    .orderBy(
      desc(delegation.logIndex),
      sql`CASE WHEN ${delegation.delegateAccountId} = ${historyPage.accountId} THEN 0 ELSE 1 END`,
      asc(delegation.delegatorAccountId),
      asc(delegation.delegateAccountId),
    )
    .limit(1)
    .as("related_delegation");

  const relatedTransfer = db
    .select()
    .from(transfer)
    .where(
      and(
        eq(transfer.transactionHash, historyPage.transactionHash),
        transferRelation === "next"
          ? gt(transfer.logIndex, historyPage.logIndex)
          : includeSameLogIndex
            ? lte(transfer.logIndex, historyPage.logIndex)
            : lt(transfer.logIndex, historyPage.logIndex),
      ),
    )
    .orderBy(
      transferRelation === "next"
        ? asc(transfer.logIndex)
        : desc(transfer.logIndex),
      asc(transfer.fromAccountId),
      asc(transfer.toAccountId),
    )
    .limit(1)
    .as("related_transfer");

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
      delegations: {
        transactionHash: relatedDelegation.transactionHash,
        daoId: relatedDelegation.daoId,
        delegateAccountId: relatedDelegation.delegateAccountId,
        delegatorAccountId: relatedDelegation.delegatorAccountId,
        delegatedValue: relatedDelegation.delegatedValue,
        previousDelegate: relatedDelegation.previousDelegate,
        timestamp: relatedDelegation.timestamp,
        logIndex: relatedDelegation.logIndex,
        isCex: relatedDelegation.isCex,
        isDex: relatedDelegation.isDex,
        isLending: relatedDelegation.isLending,
        isTotal: relatedDelegation.isTotal,
      },
      transfers: {
        transactionHash: relatedTransfer.transactionHash,
        daoId: relatedTransfer.daoId,
        tokenId: relatedTransfer.tokenId,
        amount: relatedTransfer.amount,
        fromAccountId: relatedTransfer.fromAccountId,
        toAccountId: relatedTransfer.toAccountId,
        timestamp: relatedTransfer.timestamp,
        logIndex: relatedTransfer.logIndex,
        isCex: relatedTransfer.isCex,
        isDex: relatedTransfer.isDex,
        isLending: relatedTransfer.isLending,
        isTotal: relatedTransfer.isTotal,
      },
    })
    .from(historyPage)
    .leftJoinLateral(relatedDelegation, sql`true`)
    .leftJoinLateral(relatedTransfer, sql`true`)
    .orderBy(
      orderDirection === "asc"
        ? asc(
            orderBy === "timestamp"
              ? historyPage.timestamp
              : historyPage.deltaMod,
          )
        : desc(
            orderBy === "timestamp"
              ? historyPage.timestamp
              : historyPage.deltaMod,
          ),
    );

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
