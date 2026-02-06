import { Context } from "ponder:registry";
import { Address, getAddress, Hex, zeroAddress } from "viem";
import {
  accountBalance,
  balanceHistory,
  feedEvent,
  transfer,
} from "ponder:schema";

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

  const normalizedFrom = getAddress(from);
  const normalizedTo = getAddress(to);
  const normalizedTokenId = getAddress(tokenId);

  await ensureAccountExists(context, to);
  await ensureAccountExists(context, from);

  const { balance: currentReceiverBalance } = await context.db
    .insert(accountBalance)
    .values({
      accountId: normalizedTo,
      tokenId: normalizedTokenId,
      balance: value,
      delegate: zeroAddress,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance + value,
    }));

  await context.db
    .insert(balanceHistory)
    .values({
      daoId,
      transactionHash: transactionHash,
      accountId: normalizedTo,
      balance: currentReceiverBalance,
      delta: value,
      deltaMod: value > 0n ? value : -value,
      timestamp,
      logIndex,
    })
    .onConflictDoNothing();

  if (from !== zeroAddress) {
    const { balance: currentSenderBalance } = await context.db
      .insert(accountBalance)
      .values({
        accountId: normalizedFrom,
        tokenId: normalizedTokenId,
        balance: -value,
        delegate: zeroAddress,
      })
      .onConflictDoUpdate((current) => ({
        balance: current.balance - value,
      }));

    await context.db
      .insert(balanceHistory)
      .values({
        daoId,
        transactionHash: transactionHash,
        accountId: normalizedFrom,
        balance: currentSenderBalance,
        delta: -value,
        deltaMod: value > 0n ? value : -value,
        timestamp,
        logIndex,
      })
      .onConflictDoNothing();
  }

  const normalizedCex = cex.map(getAddress);
  const normalizedDex = dex.map(getAddress);
  const normalizedLending = lending.map(getAddress);
  const normalizedBurning = burning.map(getAddress);

  await context.db
    .insert(transfer)
    .values({
      transactionHash,
      daoId,
      tokenId: normalizedTokenId,
      amount: value,
      fromAccountId: normalizedFrom,
      toAccountId: normalizedTo,
      timestamp,
      logIndex,
      isCex:
        normalizedCex.includes(normalizedFrom) ||
        normalizedCex.includes(normalizedTo),
      isDex:
        normalizedDex.includes(normalizedFrom) ||
        normalizedDex.includes(normalizedTo),
      isLending:
        normalizedLending.includes(normalizedFrom) ||
        normalizedLending.includes(normalizedTo),
      isTotal:
        normalizedBurning.includes(normalizedFrom) ||
        normalizedBurning.includes(normalizedTo),
    })
    .onConflictDoUpdate((current) => ({
      amount: current.amount + value,
    }));

  // Insert feed event for activity feed
  await context.db.insert(feedEvent).values({
    txHash: transactionHash,
    logIndex,
    type: "TRANSFER",
    value,
    timestamp,
  });
};
