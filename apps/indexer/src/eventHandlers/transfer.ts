import type { handlerContext } from "../../generated/index.js";
import type { EventType_t } from "../../generated/src/db/Enums.gen.ts";
import type { Address, Hex } from "viem";
import { getAddress, zeroAddress } from "viem";

import { DaoIdEnum } from "../lib/enums.ts";

import {
  AddressCollection,
  ensureAccountsExist,
  toAddressSet,
} from "./shared.ts";

export const tokenTransfer = async (
  context: handlerContext,
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
    cex?: AddressCollection;
    dex?: AddressCollection;
    lending?: AddressCollection;
    burning?: AddressCollection;
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

  await ensureAccountsExist(context, [from, to]);

  // Upsert receiver balance and track current balance for history
  const receiverBalanceId = `${normalizedTo}-${normalizedTokenId}`;
  const existingReceiverBalance =
    await context.AccountBalance.get(receiverBalanceId);
  const currentReceiverBalance = existingReceiverBalance
    ? existingReceiverBalance.balance + value
    : value;
  context.AccountBalance.set({
    id: receiverBalanceId,
    accountId: normalizedTo,
    tokenId: normalizedTokenId,
    balance: currentReceiverBalance,
    delegate: existingReceiverBalance?.delegate ?? zeroAddress,
  });

  context.BalanceHistory.set({
    id: `${transactionHash}-${normalizedTo}-${logIndex}`,
    daoId,
    transactionHash,
    accountId: normalizedTo,
    balance: currentReceiverBalance,
    delta: value,
    deltaMod: value > 0n ? value : -value,
    timestamp,
    logIndex,
  });

  if (from !== zeroAddress) {
    const senderBalanceId = `${normalizedFrom}-${normalizedTokenId}`;
    const existingSenderBalance =
      await context.AccountBalance.get(senderBalanceId);
    const currentSenderBalance = existingSenderBalance
      ? existingSenderBalance.balance - value
      : -value;
    context.AccountBalance.set({
      id: senderBalanceId,
      accountId: normalizedFrom,
      tokenId: normalizedTokenId,
      balance: currentSenderBalance,
      delegate: existingSenderBalance?.delegate ?? zeroAddress,
    });

    context.BalanceHistory.set({
      id: `${transactionHash}-${normalizedFrom}-${logIndex}`,
      daoId,
      transactionHash,
      accountId: normalizedFrom,
      balance: currentSenderBalance,
      delta: -value,
      deltaMod: value > 0n ? value : -value,
      timestamp,
      logIndex,
    });
  }

  const normalizedCex = toAddressSet(cex);
  const normalizedDex = toAddressSet(dex);
  const normalizedLending = toAddressSet(lending);
  const normalizedBurning = toAddressSet(burning);

  const transferId = `${transactionHash}-${normalizedFrom}-${normalizedTo}`;
  const existingTransfer = await context.Transfer.get(transferId);
  context.Transfer.set({
    id: transferId,
    transactionHash,
    daoId,
    tokenId: normalizedTokenId,
    amount: (existingTransfer?.amount ?? 0n) + value,
    fromAccountId: normalizedFrom,
    toAccountId: normalizedTo,
    timestamp,
    logIndex,
    isCex: normalizedCex.has(normalizedFrom) || normalizedCex.has(normalizedTo),
    isDex: normalizedDex.has(normalizedFrom) || normalizedDex.has(normalizedTo),
    isLending:
      normalizedLending.has(normalizedFrom) ||
      normalizedLending.has(normalizedTo),
    isTotal:
      normalizedBurning.has(normalizedFrom) ||
      normalizedBurning.has(normalizedTo),
  });

  context.FeedEvent.set({
    id: `${transactionHash}-${logIndex}`,
    txHash: transactionHash,
    logIndex,
    eventType: "TRANSFER" as EventType_t,
    value,
    timestamp,
    metadata: {
      from: normalizedFrom,
      to: normalizedTo,
      amount: value.toString(),
    },
  });
};
