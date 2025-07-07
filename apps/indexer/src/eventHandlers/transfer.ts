import { Context, Event } from "ponder:registry";
import { Address, zeroAddress } from "viem";
import { account, accountBalance, transfer, token } from "ponder:schema";

import { getValueFromEventArgs } from "@/lib/utils";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  TREASURY_ADDRESSES,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { DaoTransferEvent } from "@/indexer/types";
import { storeDailyBucket } from "./shared";

const updateSupplyMetric = async (
  context: Context,
  event: Event,
  tokenData: {
    lendingSupply: bigint;
    cexSupply: bigint;
    dexSupply: bigint;
    treasury: bigint;
  },
  supplyField: "lendingSupply" | "cexSupply" | "dexSupply" | "treasury",
  addressList: Address[],
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: string,
) => {
  const currentSupply = tokenData[supplyField] ?? BigInt(0);
  const isToRelevant = addressList.includes(to);
  const isFromRelevant = addressList.includes(from);

  if ((isToRelevant || isFromRelevant) && !(isToRelevant && isFromRelevant)) {
    const updateObject = {} as Record<string, any>;
    updateObject[supplyField] = isToRelevant
      ? tokenData[supplyField] + value
      : tokenData[supplyField] - value;

    const newSupply = (
      await context.db
        .update(token, { id: event.log.address })
        .set(() => updateObject)
    )[supplyField];

    await storeDailyBucket(
      context,
      event,
      metricType,
      currentSupply,
      newSupply,
      daoId,
    );
  }
};

const updateTotalSupplyMetric = async (
  context: Context,
  event: Event,
  tokenData: { totalSupply: bigint },
  addressList: Address[],
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: string,
) => {
  const currentTotalSupply = tokenData.totalSupply ?? BigInt(0);
  const isToBurningAddress = addressList.includes(to);
  const isFromBurningAddress = addressList.includes(from);
  const isTotalSupplyTransaction =
    (isToBurningAddress || isFromBurningAddress) &&
    !(isToBurningAddress && isFromBurningAddress);

  if (isTotalSupplyTransaction) {
    const isBurningTokens = addressList.includes(to);
    const newTotalSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        totalSupply: isBurningTokens
          ? row.totalSupply - value
          : row.totalSupply + value,
      }))
    ).totalSupply;

    await storeDailyBucket(
      context,
      event,
      metricType,
      currentTotalSupply,
      newTotalSupply,
      daoId,
    );
  }
};

const updateCirculatingSupplyMetric = async (
  context: Context,
  event: Event,
  tokenData: { circulatingSupply: bigint },
  isTotalSupplyTransaction: boolean,
  isTreasuryTransaction: boolean,
  metricType: MetricTypesEnum,
  daoId: string,
) => {
  const currentCirculatingSupply = tokenData.circulatingSupply ?? BigInt(0);
  const isCirculatingSupplyTransaction =
    isTotalSupplyTransaction || isTreasuryTransaction;

  if (isCirculatingSupplyTransaction) {
    const newCirculatingSupply = (
      await context.db.update(token, { id: event.log.address }).set((row) => ({
        circulatingSupply: row.totalSupply - row.treasury,
      }))
    ).circulatingSupply;

    await storeDailyBucket(
      context,
      event,
      metricType,
      currentCirculatingSupply,
      newCirculatingSupply,
      daoId,
    );
  }
};

export const tokenTransfer = async (
  event: DaoTransferEvent,
  context: Context,
  daoId: DaoIdEnum,
  tokenAddress: Address,
) => {
  //Picking "value" from the event.args if the dao is ENS or SHU, otherwise picking "amount"
  const value = getValueFromEventArgs<bigint, (typeof event)["args"]>(
    [
      { name: "value", daos: ["ENS", "SHU", "ARB"] },
      { name: "amount", daos: ["COMP", "UNI"] },
    ],
    event.args,
    daoId,
  );

  const { from, to } = event.args;

  await context.db
    .insert(account)
    .values({
      id: to,
    })
    .onConflictDoNothing();

  await context.db
    .insert(account)
    .values({
      id: from,
    })
    .onConflictDoNothing();

  await context.db
    .insert(transfer)
    .values({
      transactionHash: event.transaction.hash,
      daoId,
      tokenId: tokenAddress,
      amount: value,
      fromAccountId: from,
      toAccountId: to,
      timestamp: event.block.timestamp,
    })
    .onConflictDoNothing();

  // Update the to account's balance
  await context.db
    .insert(accountBalance)
    .values({
      accountId: to,
      tokenId: tokenAddress,
      balance: value,
      delegate: zeroAddress,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance + value,
    }));

  // Update the from account's balance (skip if minting from zero address)
  if (from !== zeroAddress) {
    await context.db
      .insert(accountBalance)
      .values({
        accountId: from,
        tokenId: tokenAddress,
        balance: -value,
        delegate: zeroAddress,
      })
      .onConflictDoUpdate((current) => ({
        balance: current.balance - value,
      }));
  }

  // Single token query for all supply calculations
  const tokenData = await context.db.find(token, {
    id: event.log.address,
  });

  if (!tokenData) {
    return;
  }

  // Pre-compute address lists
  const lendingAddressList = Object.values(LendingAddresses[daoId]);
  const cexAddressList = Object.values(CEXAddresses[daoId]);
  const dexAddressList = Object.values(DEXAddresses[daoId]);
  const treasuryAddressList = Object.values(TREASURY_ADDRESSES[daoId]);
  const burningAddressList = Object.values(BurningAddresses[daoId]);

  // Update lending supply
  await updateSupplyMetric(
    context,
    event,
    tokenData,
    "lendingSupply",
    lendingAddressList,
    MetricTypesEnum.LENDING_SUPPLY,
    from,
    to,
    value,
    daoId,
  );

  // Update CEX supply
  await updateSupplyMetric(
    context,
    event,
    tokenData,
    "cexSupply",
    cexAddressList,
    MetricTypesEnum.CEX_SUPPLY,
    from,
    to,
    value,
    daoId,
  );

  // Update DEX supply
  await updateSupplyMetric(
    context,
    event,
    tokenData,
    "dexSupply",
    dexAddressList,
    MetricTypesEnum.DEX_SUPPLY,
    from,
    to,
    value,
    daoId,
  );

  // Update treasury supply
  const isToTreasury = treasuryAddressList.includes(to);
  const isFromTreasury = treasuryAddressList.includes(from);
  const isTreasuryTransaction =
    (isToTreasury || isFromTreasury) && !(isToTreasury && isFromTreasury);

  await updateSupplyMetric(
    context,
    event,
    tokenData,
    "treasury",
    treasuryAddressList,
    MetricTypesEnum.TREASURY,
    from,
    to,
    value,
    daoId,
  );

  // Update total supply
  const isToBurningAddress = burningAddressList.includes(to);
  const isFromBurningAddress = burningAddressList.includes(from);
  const isTotalSupplyTransaction =
    (isToBurningAddress || isFromBurningAddress) &&
    !(isToBurningAddress && isFromBurningAddress);

  await updateTotalSupplyMetric(
    context,
    event,
    tokenData,
    burningAddressList,
    MetricTypesEnum.TOTAL_SUPPLY,
    from,
    to,
    value,
    daoId,
  );

  // Update circulating supply
  await updateCirculatingSupplyMetric(
    context,
    event,
    tokenData,
    isTotalSupplyTransaction,
    isTreasuryTransaction,
    MetricTypesEnum.CIRCULATING_SUPPLY,
    daoId,
  );
};
