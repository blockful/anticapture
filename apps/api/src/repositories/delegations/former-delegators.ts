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
   * A gaps-and-islands pass groups each delegator's events into stints of
   * consecutive delegations towards the queried address; the event right after
   * the last stint is the move-away event, so a delegator with one is former.
   *
   * Rows are collapsed per source event before being sequenced: partial
   * delegation DAOs (SCR) write one row per delegatee out of a single
   * `DelegateChanged`, all sharing the transaction hash, log index and
   * timestamp, and sequencing them individually would read each one as a move
   * away from its own sibling.
   *
   * Events are sequenced by (timestamp, log_index), which is a chronological
   * order only while no two blocks share a timestamp: `log_index` restarts in
   * every block, so same-second blocks could be interleaved and the wrong event
   * read as the move-away one. Every chain indexed today has a block time of two
   * seconds or more (Ethereum, Optimism, Scroll), so the tie cannot happen. A
   * sub-second chain would need a block number carried on `delegations` and
   * sequenced ahead of `log_index`.
   */
  private buildFormerDelegatorsCte(address: Address) {
    return sql`
      WITH delegation_rows AS (
        SELECT
          delegator_account_id AS delegator,
          delegate_account_id AS delegate,
          previous_delegate,
          delegated_value,
          timestamp,
          transaction_hash,
          log_index
        FROM delegations
        WHERE delegator_account_id IN (
          SELECT DISTINCT delegator_account_id
          FROM delegations
          WHERE delegate_account_id = ${address}
        )
      ),
      events AS (
        SELECT
          delegator,
          MIN(timestamp) AS timestamp,
          BOOL_OR(delegate = ${address}) AS to_target,
          -- what the delegator had on the queried address at this event
          MAX(delegated_value) FILTER (WHERE delegate = ${address})
            AS target_value,
          -- everything the event delegated, across all delegatees
          SUM(delegated_value) AS event_value,
          COUNT(*) FILTER (WHERE previous_delegate = ${address})
            AS from_target_count,
          MIN(delegate) FILTER (WHERE previous_delegate = ${address})
            AS from_target_delegate,
          ROW_NUMBER() OVER (
            PARTITION BY delegator
            ORDER BY MIN(timestamp) ASC, log_index ASC, transaction_hash ASC
          ) AS rn
        FROM delegation_rows
        GROUP BY delegator, transaction_hash, log_index
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
          -- Voting power the queried address actually lost at the move away.
          -- target_value alone is a snapshot of the delegator's balance back
          -- when they last delegated here: balances that move while the
          -- delegation stands write no delegations row, so the snapshot goes
          -- stale and would under- or over-state the loss. What survives a
          -- balance change is the share of the balance this address held, so
          -- the stale value is rescaled onto the balance the move-away event
          -- carries. Full-delegation DAOs hold the whole balance, making the
          -- share 1 and the loss the move-away value; partial delegation (SCR)
          -- keeps its fraction instead of claiming the sibling delegates' part.
          CASE
            WHEN last_event.event_value = 0 THEN 0
            ELSE FLOOR(
              last_event.target_value::numeric
                * move_event.event_value::numeric
                / last_event.event_value::numeric
            )
          END::text AS amount,
          move_event.event_value::text AS redelegated_amount,
          ls.start_timestamp::text AS start_timestamp,
          move_event.timestamp::text AS end_timestamp,
          -- Only name a destination when the move-away event points a single
          -- delegation away from the queried address. A split across several
          -- new delegatees has no single destination, so it stays null.
          CASE
            WHEN move_event.from_target_count = 1
            THEN move_event.from_target_delegate
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
