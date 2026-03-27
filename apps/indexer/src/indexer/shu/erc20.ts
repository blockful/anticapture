import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import {
  updateCirculatingSupply,
  updateDelegatedSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";
import { createAddressSet, handleTransaction } from "@/eventHandlers/shared";
import {
  CEXAddresses,
  DEXAddresses,
  BurningAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
  MetricTypesEnum,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

export function SHUTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.SHU;
  const cexAddressSet = createAddressSet(Object.values(CEXAddresses[daoId]));
  const dexAddressSet = createAddressSet(Object.values(DEXAddresses[daoId]));
  const burningAddressSet = createAddressSet(
    Object.values(BurningAddresses[daoId]),
  );
  const treasuryAddressSet = createAddressSet(
    Object.values(TreasuryAddresses[daoId]),
  );
  const nonCirculatingAddressSet = createAddressSet(
    Object.values(NonCirculatingAddresses[daoId]),
  );
  const delegationAddressSets = {
    cex: cexAddressSet,
    dex: dexAddressSet,
    lending: createAddressSet([]),
    burning: burningAddressSet,
  };

  ponder.on("SHUToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("SHUToken:Transfer", async ({ event, context }) => {
    await tokenTransfer(
      context,
      daoId,
      {
        from: event.args.from,
        to: event.args.to,
        token: address,
        transactionHash: event.transaction.hash,
        value: event.args.value,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      {
        cex: cexAddressSet,
        dex: dexAddressSet,
        burning: burningAddressSet,
      },
    );

    const cexChanged = await updateSupplyMetric(
      context,
      "cexSupply",
      cexAddressSet,
      MetricTypesEnum.CEX_SUPPLY,
      event.args.from,
      event.args.to,
      event.args.value,
      daoId,
      address,
      event.block.timestamp,
    );

    const dexChanged = await updateSupplyMetric(
      context,
      "dexSupply",
      dexAddressSet,
      MetricTypesEnum.DEX_SUPPLY,
      event.args.from,
      event.args.to,
      event.args.value,
      daoId,
      address,
      event.block.timestamp,
    );

    const treasuryChanged = await updateSupplyMetric(
      context,
      "treasury",
      treasuryAddressSet,
      MetricTypesEnum.TREASURY,
      event.args.from,
      event.args.to,
      event.args.value,
      daoId,
      address,
      event.block.timestamp,
    );

    const nonCirculatingChanged = await updateSupplyMetric(
      context,
      "nonCirculatingSupply",
      nonCirculatingAddressSet,
      MetricTypesEnum.NON_CIRCULATING_SUPPLY,
      event.args.from,
      event.args.to,
      event.args.value,
      daoId,
      address,
      event.block.timestamp,
    );

    const totalSupplyChanged = await updateTotalSupply(
      context,
      burningAddressSet,
      MetricTypesEnum.TOTAL_SUPPLY,
      event.args.from,
      event.args.to,
      event.args.value,
      daoId,
      address,
      event.block.timestamp,
    );

    if (
      cexChanged ||
      dexChanged ||
      treasuryChanged ||
      nonCirculatingChanged ||
      totalSupplyChanged
    ) {
      await updateCirculatingSupply(
        context,
        daoId,
        address,
        event.block.timestamp,
      );
    }

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.from, event.args.to],
      {
        cex: cexAddressSet,
        dex: dexAddressSet,
        burning: burningAddressSet,
      },
    );
  });

  ponder.on(`SHUToken:DelegateChanged`, async ({ event, context }) => {
    await delegateChanged(
      context,
      daoId,
      {
        delegator: event.args.delegator,
        delegate: event.args.toDelegate,
        tokenId: event.log.address,
        previousDelegate: event.args.fromDelegate,
        txHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      delegationAddressSets,
    );

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.delegator, event.args.toDelegate], // Addresses to check
    );
  });

  ponder.on(`SHUToken:DelegateVotesChanged`, async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newVotes,
      oldBalance: event.args.previousVotes,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

    await updateDelegatedSupply(
      context,
      daoId,
      event.log.address,
      event.args.newVotes - event.args.previousVotes,
      event.block.timestamp,
    );

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.delegate], // Address to check
    );
  });
}
