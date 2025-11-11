import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import { handleTransaction } from "@/eventHandlers/shared";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  TreasuryAddresses,
} from "@/lib/constants";
import {
  updateCirculatingSupply,
  updateDelegatedSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function COMPTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.COMP;

  ponder.on(`COMPToken:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`COMPToken:Transfer`, async ({ event, context }) => {
    const { logIndex } = event.log;
    const { hash } = event.transaction;
    const { from, to, amount } = event.args;
    const { timestamp } = event.block;

    const cexAddressList = Object.values(CEXAddresses[daoId]);
    const dexAddressList = Object.values(DEXAddresses[daoId]);
    const lendingAddressList = Object.values(LendingAddresses[daoId]);
    const burningAddressList = Object.values(BurningAddresses[daoId]);
    const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);

    // Process the transfer
    await tokenTransfer(
      context,
      daoId,
      {
        from: from,
        to: to,
        token: address,
        transactionHash: hash,
        value: amount,
        timestamp: timestamp,
        logIndex: logIndex,
      },
      {
        cex: cexAddressList,
        dex: dexAddressList,
        burning: burningAddressList,
      },
    );

    await updateSupplyMetric(
      context,
      "lendingSupply",
      lendingAddressList,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "cexSupply",
      cexAddressList,
      MetricTypesEnum.CEX_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "dexSupply",
      dexAddressList,
      MetricTypesEnum.DEX_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "treasury",
      treasuryAddressList,
      MetricTypesEnum.TREASURY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    await updateTotalSupply(
      context,
      burningAddressList,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    await updateCirculatingSupply(
      context,
      MetricTypesEnum.CIRCULATING_SUPPLY,
      daoId,
      address,
      timestamp,
    );

    if (!to) return;

    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      hash,
      from,
      to,
      timestamp,
      [from, to], // Addresses to check
      {
        cex: cexAddressList,
        dex: dexAddressList,
        lending: lendingAddressList,
        burning: burningAddressList,
      },
    );
  });

  ponder.on(`COMPToken:DelegateChanged`, async ({ event, context }) => {
    const { logIndex, address } = event.log;
    const { hash, from, to } = event.transaction;
    const { delegator, toDelegate, fromDelegate } = event.args;
    const { timestamp } = event.block;

    // Process the delegation change
    await delegateChanged(context, daoId, {
      delegator: delegator,
      toDelegate: toDelegate,
      tokenId: address,
      fromDelegate: fromDelegate,
      txHash: hash,
      timestamp: timestamp,
      logIndex: logIndex,
    });

    if (!to) return;

    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      hash,
      from,
      to,
      timestamp,
      [delegator, toDelegate], // Addresses to check
    );
  });

  ponder.on(`COMPToken:DelegateVotesChanged`, async ({ event, context }) => {
    const { logIndex, address } = event.log;
    const { hash, from, to } = event.transaction;
    const { delegate, newBalance, previousBalance } = event.args;
    const { timestamp } = event.block;

    // Process the delegate votes change
    await delegatedVotesChanged(context, daoId, {
      delegate: delegate,
      txHash: hash,
      newBalance: newBalance,
      oldBalance: previousBalance,
      timestamp: timestamp,
      logIndex: logIndex,
    });

    await updateDelegatedSupply(
      context,
      daoId,
      address,
      newBalance - previousBalance,
      timestamp,
    );

    if (!to) return;

    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      hash,
      from,
      to,
      timestamp,
      [delegate], // Address to check
    );
  });
}
