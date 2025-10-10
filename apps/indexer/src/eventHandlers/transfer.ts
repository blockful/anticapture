import { Context } from "ponder:registry";
import { Address, Hex, zeroAddress } from "viem";
import { accountBalance, transfer } from "ponder:schema";

import { DaoIdEnum } from "@/lib/enums";
import { ensureAccountExists } from "./shared";

/**
 * ### Creates:
 * - New `Account` records (for sender and receiver if they don't exist)
 * - New `accountBalance` record (for receiver if it doesn't exist)
 * - New `accountBalance` record (for sender if it doesn't exist and not minting)
 * - New `transfer` record with transaction details and classification flags
 * - New daily metric records for supply tracking (via `updateSupplyMetric` calls)
 *
 * ### Updates:
 * - `accountBalance`: Increments receiver's token balance by transfer value
 * - `accountBalance`: Decrements sender's token balance by transfer value (if not minting from zero address)
 * - `Token`: Adjusts lending supply based on transfers involving lending addresses
 * - `Token`: Adjusts CEX supply based on transfers involving centralized exchange addresses
 * - `Token`: Adjusts DEX supply based on transfers involving decentralized exchange addresses
 * - `Token`: Adjusts treasury balance based on transfers involving treasury addresses
 * - `Token`: Adjusts total supply based on transfers involving burning addresses
 * - `Token`: Recalculates circulating supply after all supply changes
 * - Daily bucket metrics for all supply types (lending, CEX, DEX, treasury, total, circulating)
 */
export const tokenTransfer = async (
  context: Context,
  daoId: DaoIdEnum,
  args: {
    from: Address;
    to: Address;
    token: Address;
    transactionHash: Hex;
    value: bigint;
    timestamp: bigint;
    logIndex: number;
  },
  {
    cex = [],
    dex = [],
    lending = [],
    burning = [],
  }: {
    cex?: Address[];
    dex?: Address[];
    lending?: Address[];
    burning?: Address[];
  },
) => {
  const {
    from,
    to,
    token: tokenId,
    transactionHash,
    value,
    timestamp,
    logIndex,
  } = args;

  await ensureAccountExists(context, to);
  await ensureAccountExists(context, from);

  await context.db
    .insert(accountBalance)
    .values({
      accountId: to,
      tokenId,
      balance: value,
      delegate: zeroAddress,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance + value,
    }));

  if (from !== zeroAddress) {
    await context.db
      .update(accountBalance, {
        accountId: from,
        tokenId,
      })
      .set((current) => ({
        balance: current.balance - value,
      }));
  }

  await context.db
    .insert(transfer)
    .values({
      transactionHash,
      daoId,
      tokenId,
      amount: value,
      fromAccountId: from,
      toAccountId: to,
      timestamp,
      logIndex,
      isCex: cex.includes(from) || cex.includes(to),
      isDex: dex.includes(from) || dex.includes(to),
      isLending: lending.includes(from) || lending.includes(to),
      isTotal: burning.includes(from) || burning.includes(to),
    })
    .onConflictDoUpdate((current) => ({
      amount: current.amount + value,
    }));
};
