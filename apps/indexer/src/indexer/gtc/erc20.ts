import { Context, Event, ponder } from "ponder:registry";
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
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
} from "@/lib/constants";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function GTCTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.GTC;

  ponder.on("GTCToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(
    "GTCToken:Transfer",
    async ({
      event,
      context,
    }: {
      event: Event<"GTCToken:Transfer">;
      context: Context;
    }) => {
      const { from, to, amount } = event.args;
      const { timestamp } = event.block;

      const tokenData = await context.db.find(token, {
        id: address,
      });

      if (!tokenData) {
        return;
      }

      const cexAddressList = Object.values(CEXAddresses[daoId]);
      const dexAddressList = Object.values(DEXAddresses[daoId]);
      const lendingAddressList = Object.values(LendingAddresses[daoId]);
      const burningAddressList = Object.values(BurningAddresses[daoId]);
      const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);

      await tokenTransfer(
        context,
        daoId,
        {
          from,
          to,
          value: amount,
          token: address,
          transactionHash: event.transaction.hash,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex,
        },
        {
          cex: cexAddressList,
          dex: dexAddressList,
          lending: lendingAddressList,
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
        tokenData.totalSupply,
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
        tokenData,
        MetricTypesEnum.CIRCULATING_SUPPLY,
        daoId,
        address,
        timestamp,
      );

      if (!event.transaction.to) return;

      await handleTransaction(
        context,
        event.transaction.hash,
        event.transaction.from,
        event.transaction.to,
        event.block.timestamp,
        [event.args.from, event.args.to],
        {
          cex: cexAddressList,
          dex: dexAddressList,
          lending: lendingAddressList,
          burning: burningAddressList,
        },
      );
    },
  );

  ponder.on(`GTCToken:DelegateChanged`, async ({ event, context }) => {
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      tokenId: event.log.address,
      fromDelegate: event.args.fromDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

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

  ponder.on(`GTCToken:DelegateVotesChanged`, async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

    await updateDelegatedSupply(context, daoId, {
      tokenId: event.log.address,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
    });

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
