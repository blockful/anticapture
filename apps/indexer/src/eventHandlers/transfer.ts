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
  tokenData: {
    circulatingSupply: bigint;
    totalSupply: bigint;
    treasury: bigint;
  },
  metricType: MetricTypesEnum,
  daoId: string,
  tokenAddress: Address,
  timestamp: bigint,
) => {
  const currentCirculatingSupply = tokenData.circulatingSupply ?? BigInt(0);

  // Calculate circulating supply as total supply minus treasury
  const newCirculatingSupply = tokenData.totalSupply - tokenData.treasury;

  if (newCirculatingSupply !== currentCirculatingSupply) {
    await context.db.update(token, { id: tokenAddress }).set({
      circulatingSupply: newCirculatingSupply,
    });

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

  // Transaction handling moved to DAO-specific indexer

  // Transfer record will be created later with proper flags after address list calculations

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

  // Update the from account's balance (skip if minting from zero address)
  if (from !== zeroAddress) {
    await context.db
      .insert(accountBalance)
      .values({
        accountId: from,
        tokenId,
        balance: -value,
        delegate: zeroAddress,
      })
      .onConflictDoUpdate((current) => ({
        balance: current.balance - value,
      }));
  }

  // Single token query for all supply calculations
  const tokenData = await context.db.find(token, {
    id: tokenId,
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

  // Determine flags for the transfer
  const isCex = cexAddressList.includes(from) || cexAddressList.includes(to);
  const isDex = dexAddressList.includes(from) || dexAddressList.includes(to);
  const isLending =
    lendingAddressList.includes(from) || lendingAddressList.includes(to);
  const isBurning =
    burningAddressList.includes(from) || burningAddressList.includes(to);
  const isTotal = isBurning;

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
      isCex,
      isDex,
      isLending,
      isTotal,
    })
    .onConflictDoUpdate((current) => ({
      amount: (current.amount ?? 0n) + value,
    }));

  // Transaction flag updates moved to DAO-specific indexer

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
    tokenId,
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
    tokenId,
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
    tokenId,
    timestamp,
  );

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
    tokenId,
    timestamp,
  );

  await updateTotalSupplyMetric(
    context,
    tokenData,
    burningAddressList,
    MetricTypesEnum.TOTAL_SUPPLY,
    from,
    to,
    value,
    daoId,
    tokenId,
    timestamp,
  );

  // Update circulating supply
  await updateCirculatingSupplyMetric(
    context,
    tokenData,
    MetricTypesEnum.CIRCULATING_SUPPLY,
    daoId,
    tokenId,
    timestamp,
  );
};
