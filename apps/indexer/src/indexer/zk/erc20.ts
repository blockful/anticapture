import { Context, Event, ponder } from "ponder:registry";
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
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function ZKTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.ZK;
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

  ponder.on("ZKToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(
    "ZKToken:Transfer",
    async ({
      event,
      context,
    }: {
      event: Event<"ZKToken:Transfer">;
      context: Context;
    }) => {
      const { from, to, value } = event.args;
      const { timestamp } = event.block;

      await tokenTransfer(
        context,
        daoId,
        {
          from,
          to,
          value: value,
          token: address,
          transactionHash: event.transaction.hash,
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
        from,
        to,
        value,
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
        value,
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
        value,
        daoId,
        address,
        timestamp,
      );

      const nonCirculatingChanged = await updateSupplyMetric(
        context,
        "nonCirculatingSupply",
        nonCirculatingAddressSet,
        MetricTypesEnum.NON_CIRCULATING_SUPPLY,
        from,
        to,
        value,
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
        value,
        daoId,
        address,
        timestamp,
      );

      if (
        cexChanged ||
        dexChanged ||
        treasuryChanged ||
        nonCirculatingChanged ||
        totalSupplyChanged
      ) {
        await updateCirculatingSupply(context, daoId, address, timestamp);
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
    },
  );

  ponder.on(`ZKToken:DelegateChanged`, async ({ event, context }) => {
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

  ponder.on(`ZKToken:DelegateVotesChanged`, async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

    await updateDelegatedSupply(
      context,
      daoId,
      event.log.address,
      event.args.newBalance - event.args.previousBalance,
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
