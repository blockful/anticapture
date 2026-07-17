import { gte, and, lte, eq } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle, votingPowerHistory } from "@/database";
import { DBHistoricalVotingPowerWithRelations } from "@/mappers";

import { getHistoricalVotingPowersWithRelations } from "./historical-query";

/**
 * TORN derives per-account voting power directly from lock/unlock Transfers
 * (it emits no DelegateVotesChanged), so each `votingPowerHistory` row is
 * written with the SAME `logIndex` as the Transfer that produced it. The
 * generic repository links events with `logIndex < votingPowerHistory.logIndex`,
 * which never matches a same-index event and leaves the row with no transfer —
 * the dashboard then renders it as a bogus delegation from the zero address.
 *
 * This repository matches the causing event at `logIndex <= votingPowerHistory.logIndex`
 * (closest preceding-or-equal), keeping everything else identical to the generic one.
 */
export class TORNVotingPowerRepository {
  constructor(private readonly db: Drizzle) {}

  async getHistoricalVotingPowerCount(
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<number> {
    return await this.db.$count(
      votingPowerHistory,
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
    );
  }

  async getHistoricalVotingPowers(
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
    orderBy: "timestamp" | "delta",
    accountId?: Address,
    minDelta?: string,
    maxDelta?: string,
    fromDate?: number,
    toDate?: number,
  ): Promise<DBHistoricalVotingPowerWithRelations[]> {
    const result = await getHistoricalVotingPowersWithRelations(this.db, {
      skip,
      limit,
      orderDirection,
      orderBy,
      accountId,
      minDelta,
      maxDelta,
      fromDate,
      toDate,
      includeSameLogIndex: true,
    });

    return result.map((row) => {
      const transfers = row.transfers;

      return {
        ...row,
        // TORN's lock/unlock Transfer moves tokens OPPOSITE to the voting-power
        // change: a lock (VP gain) sends TORN wallet -> custody, an unlock (VP
        // loss) sends custody -> wallet. The dashboard derives the delegator as
        // `isGain ? transfer.to : transfer.from`, which would surface the
        // custody contract instead of the locker. Swap from/to so the locker
        // who caused the change is shown.
        transfers: transfers
          ? {
              ...transfers,
              fromAccountId: transfers.toAccountId,
              toAccountId: transfers.fromAccountId,
            }
          : null,
      };
    });
  }
}
