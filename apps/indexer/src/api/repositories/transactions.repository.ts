import { transaction, transfer, delegation } from "ponder:schema";
import {
  DBDelegation,
  DBTransaction,
  DBTransfer,
  TransactionsRequest,
} from "../mappers";
import {
  sql,
  and,
  or,
  eq,
  gte,
  lte,
  isNotNull,
  desc,
  asc,
  SQL,
  getTableColumns,
} from "drizzle-orm";
import { db } from "ponder:api";

export class TransactionsRepository {
  async getAggregateTransactions(
    filter: TransactionsRequest,
  ): Promise<DBTransaction[]> {
    const { transfer: transferConditions, delegation: delegationConditions } =
      this.buildWhere(filter);

    const filteredTransfers = db.$with("filtered_transfers").as(
      db
        .select()
        .from(transfer)
        .where(and(...transferConditions)),
    );

    const filteredDelegations = db.$with("filtered_delegations").as(
      db
        .select()
        .from(delegation)
        .where(and(...delegationConditions)),
    );

    const transferAgg = db.$with("transfer_agg").as(
      db
        .select({
          transactionHash: filteredTransfers.transactionHash,
          transfers: sql`ARRAY_AGG(ROW(${filteredTransfers}.*))`.as(
            "transfers",
          ),
        })
        .from(filteredTransfers)
        .groupBy(filteredTransfers.transactionHash),
    );

    const delegationAgg = db.$with("delegation_agg").as(
      db
        .select({
          transactionHash: filteredDelegations.transactionHash,
          delegations: sql`ARRAY_AGG(ROW(${filteredDelegations}.*))`.as(
            "delegations",
          ),
        })
        .from(filteredDelegations)
        .groupBy(filteredDelegations.transactionHash),
    );

    const result = await db
      .with(filteredTransfers, filteredDelegations, transferAgg, delegationAgg)
      .select({
        ...getTableColumns(transaction),
        transfers: sql<DBTransfer[]>`COALESCE(
      (SELECT ARRAY_AGG(
        jsonb_build_object(
          'transactionHash', ft.transaction_hash,
          'daoId', ft.dao_id,
          'tokenId', ft.token_id,
          'amount', ft.amount,
          'fromAccountId', ft.from_account_id,
          'toAccountId', ft.to_account_id,
          'timestamp', ft.timestamp,
          'logIndex', ft.log_index,
          'isCex', ft.is_cex,
          'isDex', ft.is_dex,
          'isLending', ft.is_lending,
          'isTotal', ft.is_total
        )
      )
      FROM filtered_transfers ft
      WHERE ft.transaction_hash = ${transaction.transactionHash}),
      ARRAY[]::jsonb[]
    )`.as("transfers"),
        delegations: sql<DBDelegation[]>`COALESCE(
      (SELECT ARRAY_AGG(
        jsonb_build_object(
          'transactionHash', fd.transaction_hash,
          'daoId', fd.dao_id,
          'delegateAccountId', fd.delegate_account_id,
          'delegatorAccountId', fd.delegator_account_id,
          'delegatedValue', fd.delegated_value,
          'previousDelegate', fd.previous_delegate,
          'timestamp', fd.timestamp,
          'logIndex', fd.log_index,
          'isCex', fd.is_cex,
          'isDex', fd.is_dex,
          'isLending', fd.is_lending,
          'isTotal', fd.is_total
        )
      )
      FROM filtered_delegations fd
      WHERE fd.transaction_hash = ${transaction.transactionHash}),
      ARRAY[]::jsonb[]
    )`.as("delegations"),
      })
      .from(transaction)
      .leftJoin(
        transferAgg,
        eq(transferAgg.transactionHash, transaction.transactionHash),
      )
      .leftJoin(
        delegationAgg,
        eq(delegationAgg.transactionHash, transaction.transactionHash),
      )
      .where(
        or(
          isNotNull(transferAgg.transactionHash),
          isNotNull(delegationAgg.transactionHash),
        ),
      )
      .orderBy(
        filter.sortOrder === "asc"
          ? asc(transaction.timestamp)
          : desc(transaction.timestamp),
      )
      .limit(filter.limit)
      .offset(filter.offset);

    return result;
  }

  private buildWhere = (
    filter: TransactionsRequest,
  ): {
    transfer: SQL[];
    delegation: SQL[];
  } => {
    const checkIsDex = filter.affectedSupply.isDex ?? false;
    const checkIsCex = filter.affectedSupply.isCex ?? false;
    const checkIsLending = filter.affectedSupply.isLending ?? false;
    const checkIsTotal = filter.affectedSupply.isTotal ?? false;

    return {
      transfer: [
        checkIsDex ? eq(transfer.isDex, true) : sql`true`,
        checkIsCex ? eq(transfer.isCex, true) : sql`true`,
        checkIsLending ? eq(transfer.isLending, true) : sql`true`,
        checkIsTotal ? eq(transfer.isTotal, true) : sql`true`,
        ...(filter.minAmount != null
          ? [gte(transfer.amount, filter.minAmount)]
          : []),
        ...(filter.maxAmount != null
          ? [lte(transfer.amount, filter.maxAmount)]
          : []),
        ...(filter.from != null
          ? [eq(transfer.fromAccountId, filter.from)]
          : []),
        ...(filter.to != null ? [eq(transfer.toAccountId, filter.to)] : []),
      ],
      delegation: [
        checkIsDex ? eq(delegation.isDex, true) : sql`true`,
        checkIsCex ? eq(delegation.isCex, true) : sql`true`,
        checkIsLending ? eq(delegation.isLending, true) : sql`true`,
        checkIsTotal ? eq(delegation.isTotal, true) : sql`true`,
        ...(filter.minAmount != null
          ? [gte(delegation.delegatedValue, filter.minAmount)]
          : []),
        ...(filter.maxAmount != null
          ? [lte(delegation.delegatedValue, filter.maxAmount)]
          : []),
        ...(filter.from != null
          ? [eq(delegation.delegatorAccountId, filter.from)]
          : []),
        ...(filter.to != null
          ? [eq(delegation.delegateAccountId, filter.to)]
          : []),
      ],
    };
  };
}
