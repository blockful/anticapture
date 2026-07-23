import { sql } from "drizzle-orm";
import { Address } from "viem";

import { Drizzle } from "@/database";
import { DBFormerDelegator } from "@/mappers";

type FormerDelegatorRow = {
  delegator_address: Address;
  amount: string;
  redelegated_amount: string;
  start_timestamp: string;
  end_timestamp: string;
  redelegated_to: Address | null;
};

export class FormerDelegatorsRepository {
  constructor(private readonly db: Drizzle) {}

  async getFormerDelegators(
    address: Address,
    skip: number,
    limit: number,
    orderDirection: "asc" | "desc",
  ): Promise<{ items: DBFormerDelegator[]; totalCount: number }> {
    const cte = this.buildFormerDelegatorsCte(address);
    const direction = sql.raw(orderDirection === "asc" ? "ASC" : "DESC");

    const pageQuery = sql`
      ${cte}
      SELECT *
      FROM former_delegators
      ORDER BY end_timestamp::numeric ${direction}, delegator_address ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countQuery = sql`
      ${cte}
      SELECT COUNT(*) AS total_count
      FROM former_delegators
    `;

    const [pageResult, countResult] = await Promise.all([
      this.db.execute<FormerDelegatorRow>(pageQuery),
      this.db.execute<{ total_count: string }>(countQuery),
    ]);

    return {
      items: pageResult.rows.map((row) => ({
        delegatorAddress: row.delegator_address,
        amount: BigInt(row.amount),
        redelegatedAmount: BigInt(row.redelegated_amount),
        startTimestamp: BigInt(row.start_timestamp),
        endTimestamp: BigInt(row.end_timestamp),
        redelegatedTo: row.redelegated_to,
      })),
      totalCount: Number(countResult.rows[0]?.total_count ?? 0),
    };
  }

  /**
   * Former delegators are delegators that delegated to the queried address in
   * the past but whose latest delegation event points somewhere else. A
   * gaps-and-islands pass groups each delegator's delegation events into
   * stints of consecutive events towards the queried address; the event right
   * after the last stint is the move-away event, so a delegator with such an
   * event no longer delegates to the queried address.
   */
  private buildFormerDelegatorsCte(address: Address) {
    return sql`
      WITH events AS (
        SELECT
          delegator_account_id AS delegator,
          delegate_account_id AS delegate,
          previous_delegate,
          delegated_value,
          timestamp,
          ROW_NUMBER() OVER (
            PARTITION BY delegator_account_id
            ORDER BY timestamp ASC, log_index ASC
          ) AS rn,
          (delegate_account_id = ${address}) AS to_target
        FROM delegations
        WHERE delegator_account_id IN (
          SELECT DISTINCT delegator_account_id
          FROM delegations
          WHERE delegate_account_id = ${address}
        )
      ),
      islands AS (
        SELECT
          *,
          rn - ROW_NUMBER() OVER (
            PARTITION BY delegator, to_target
            ORDER BY rn
          ) AS island
        FROM events
      ),
      stints AS (
        SELECT
          delegator,
          island,
          MIN(timestamp) AS start_timestamp,
          MAX(rn) AS last_rn
        FROM islands
        WHERE to_target
        GROUP BY delegator, island
      ),
      last_stints AS (
        SELECT DISTINCT ON (delegator)
          delegator,
          start_timestamp,
          last_rn
        FROM stints
        ORDER BY delegator, last_rn DESC
      ),
      former_delegators AS (
        SELECT
          ls.delegator AS delegator_address,
          last_event.delegated_value::text AS amount,
          move_event.delegated_value::text AS redelegated_amount,
          ls.start_timestamp::text AS start_timestamp,
          move_event.timestamp::text AS end_timestamp,
          CASE
            WHEN move_event.previous_delegate = ${address}
            THEN move_event.delegate
            ELSE NULL
          END AS redelegated_to
        FROM last_stints ls
        JOIN events last_event
          ON last_event.delegator = ls.delegator
          AND last_event.rn = ls.last_rn
        JOIN events move_event
          ON move_event.delegator = ls.delegator
          AND move_event.rn = ls.last_rn + 1
      )
    `;
  }
}
