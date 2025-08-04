import { Context } from "ponder:registry";
import { Address, Hex, zeroAddress } from "viem";
import { accountBalance, transfer, token } from "ponder:schema";

import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  TREASURY_ADDRESSES,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { ensureAccountExists, storeDailyBucket } from "./shared";

const updateSupplyMetric = async (
  context: Context,
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
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const currentSupply = tokenData[supplyField] ?? BigInt(0);
  const isToRelevant = addressList.includes(to);
  const isFromRelevant = addressList.includes(from);

  if ((isToRelevant || isFromRelevant) && !(isToRelevant && isFromRelevant)) {
    const updateObject = {} as Record<string, bigint>;
    updateObject[supplyField] = isToRelevant
      ? tokenData[supplyField] + value
      : tokenData[supplyField] - value;

    const newSupply = (
      await context.db
        .update(token, { id: tokenAddress })
        .set(() => updateObject)
    )[supplyField];

    await storeDailyBucket(
      context,
      metricType,
      currentSupply,
      newSupply,
      daoId,
      timestamp,
      tokenAddress,
    );
  }
};

const updateTotalSupplyMetric = async (
  context: Context,
  tokenData: { totalSupply: bigint },
  addressList: Address[],
  metricType: MetricTypesEnum,
  from: Address,
  to: Address,
  value: bigint,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
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
      await context.db.update(token, { id: tokenAddress }).set((row) => ({
        totalSupply: isBurningTokens
          ? row.totalSupply - value
          : row.totalSupply + value,
      }))
    ).totalSupply;

    await storeDailyBucket(
      context,
      metricType,
      currentTotalSupply,
      newTotalSupply,
      daoId,
      timestamp,
      tokenAddress,
    );
  }
};

const updateCirculatingSupplyMetric = async (
  context: Context,
  tokenData: { circulatingSupply: bigint },
  isTotalSupplyTransaction: boolean,
  isTreasuryTransaction: boolean,
  metricType: MetricTypesEnum,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const currentCirculatingSupply = tokenData.circulatingSupply ?? BigInt(0);
  const isCirculatingSupplyTransaction =
    isTotalSupplyTransaction || isTreasuryTransaction;

  if (isCirculatingSupplyTransaction) {
    const newCirculatingSupply = (
      await context.db.update(token, { id: tokenAddress }).set((row) => ({
        circulatingSupply: row.totalSupply - row.treasury,
      }))
    ).circulatingSupply;

    await storeDailyBucket(
      context,
      metricType,
      currentCirculatingSupply,
      newCirculatingSupply,
      daoId,
      timestamp,
      tokenAddress,
    );
  }
};

export const tokenTransfer = async (
  context: Context,
  daoId: DaoIdEnum,
  args: {
    from: Address;
    to: Address;
    tokenAddress: Address;
    transactionHash: Hex;
    value: bigint;
    timestamp: bigint;
    logIndex: number;
  },
) => {
  const {
    from,
    to,
    tokenAddress,
    transactionHash,
    value,
    timestamp,
    logIndex,
  } = args;

  await ensureAccountExists(context, to);
  await ensureAccountExists(context, from);

  await context.db
    .insert(transfer)
    .values({
      transactionHash,
      daoId,
      tokenId: tokenAddress,
      amount: value,
      fromAccountId: from,
      toAccountId: to,
      timestamp,
      logIndex,
    })
    .onConflictDoNothing();

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
    id: tokenAddress,
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
    tokenData,
    "lendingSupply",
    lendingAddressList,
    MetricTypesEnum.LENDING_SUPPLY,
    from,
    to,
    value,
    daoId,
    tokenAddress,
    timestamp,
  );

  // Update CEX supply
  await updateSupplyMetric(
    context,
    tokenData,
    "cexSupply",
    cexAddressList,
    MetricTypesEnum.CEX_SUPPLY,
    from,
    to,
    value,
    daoId,
    tokenAddress,
    timestamp,
  );

  // Update DEX supply
  await updateSupplyMetric(
    context,
    tokenData,
    "dexSupply",
    dexAddressList,
    MetricTypesEnum.DEX_SUPPLY,
    from,
    to,
    value,
    daoId,
    tokenAddress,
    timestamp,
  );

  // Update treasury supply
  const isToTreasury = treasuryAddressList.includes(to);
  const isFromTreasury = treasuryAddressList.includes(from);
  const isTreasuryTransaction =
    (isToTreasury || isFromTreasury) && !(isToTreasury && isFromTreasury);

  await updateSupplyMetric(
    context,
    tokenData,
    "treasury",
    treasuryAddressList,
    MetricTypesEnum.TREASURY,
    from,
    to,
    value,
    daoId,
    tokenAddress,
    timestamp,
  );

  // Update total supply
  const isToBurningAddress = burningAddressList.includes(to);
  const isFromBurningAddress = burningAddressList.includes(from);
  const isTotalSupplyTransaction =
    (isToBurningAddress || isFromBurningAddress) &&
    !(isToBurningAddress && isFromBurningAddress);

  await updateTotalSupplyMetric(
    context,
    tokenData,
    burningAddressList,
    MetricTypesEnum.TOTAL_SUPPLY,
    from,
    to,
    value,
    daoId,
    tokenAddress,
    timestamp,
  );

  // Update circulating supply
  await updateCirculatingSupplyMetric(
    context,
    tokenData,
    isTotalSupplyTransaction,
    isTreasuryTransaction,
    MetricTypesEnum.CIRCULATING_SUPPLY,
    daoId,
    tokenAddress,
    timestamp,
  );
};
