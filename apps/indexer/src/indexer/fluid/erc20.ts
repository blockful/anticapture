import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import { createAddressSet, handleTransaction } from "@/eventHandlers/shared";
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

export function FLUIDTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.FLUID;
  const cexAddressSet = createAddressSet(Object.values(CEXAddresses[daoId]));
  const dexAddressSet = createAddressSet(Object.values(DEXAddresses[daoId]));
  const lendingAddressSet = createAddressSet(
    Object.values(LendingAddresses[daoId]),
  );
  const burningAddressSet = createAddressSet(
    Object.values(BurningAddresses[daoId]),
  );
  const treasuryAddressSet = createAddressSet(
    Object.values(TreasuryAddresses[daoId]),
  );
  const delegationAddressSets = {
    cex: cexAddressSet,
    dex: dexAddressSet,
    lending: lendingAddressSet,
    burning: burningAddressSet,
  };

  ponder.on(`FLUIDToken:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`FLUIDToken:Transfer`, async ({ event, context }) => {
    const { logIndex } = event.log;
    const { hash } = event.transaction;
    const { from, to, amount } = event.args;
    const { timestamp } = event.block;

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
        cex: cexAddressSet,
        dex: dexAddressSet,
        burning: burningAddressSet,
      },
    );

    const lendingChanged = await updateSupplyMetric(
      context,
      "lendingSupply",
      lendingAddressSet,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    const cexChanged = await updateSupplyMetric(
      context,
      "cexSupply",
      cexAddressSet,
      MetricTypesEnum.CEX_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    const dexChanged = await updateSupplyMetric(
      context,
      "dexSupply",
      dexAddressSet,
      MetricTypesEnum.DEX_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    const treasuryChanged = await updateSupplyMetric(
      context,
      "treasury",
      treasuryAddressSet,
      MetricTypesEnum.TREASURY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    const totalSupplyChanged = await updateTotalSupply(
      context,
      burningAddressSet,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      amount,
      daoId,
      address,
      timestamp,
    );

    if (
      lendingChanged ||
      cexChanged ||
      dexChanged ||
      treasuryChanged ||
      totalSupplyChanged
    ) {
      await updateCirculatingSupply(context, daoId, address, timestamp);
    }

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
        cex: cexAddressSet,
        dex: dexAddressSet,
        lending: lendingAddressSet,
        burning: burningAddressSet,
      },
    );
  });

  ponder.on(`FLUIDToken:DelegateChanged`, async ({ event, context }) => {
    const { logIndex, address } = event.log;
    const { hash, from, to } = event.transaction;
    const { delegator, toDelegate, fromDelegate } = event.args;
    const { timestamp } = event.block;

    // Process the delegation change
    await delegateChanged(
      context,
      daoId,
      {
        delegator: delegator,
        delegate: toDelegate,
        tokenId: address,
        previousDelegate: fromDelegate,
        txHash: hash,
        timestamp: timestamp,
        logIndex: logIndex,
      },
      delegationAddressSets,
    );

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

  ponder.on(`FLUIDToken:DelegateVotesChanged`, async ({ event, context }) => {
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
