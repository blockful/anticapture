import { Context, Event, ponder } from "ponder:registry";
import { token, transfer } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
  // updateSupplyMetric,
  // updateTotalSupplyMetric,
} from "@/eventHandlers";
import { handleTransaction } from "@/eventHandlers/shared";

export function NounsTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.NOUNS;

  ponder.on("NounsToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("NounsAuction:AuctionSettled", async ({ event, context }) => {
    await context.db
      .insert(transfer)
      .values({
        daoId,
        tokenId: address,
        amount: event.args.amount,
        timestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        fromAccountId: event.transaction.from,
        toAccountId: event.args.winner,
      })
      .onConflictDoUpdate({
        amount: event.args.amount,
      });

    // await updateSupplyMetric(
    //   context,
    //   tokenData,
    //   "lendingSupply",
    //   lendingAddressList,
    //   MetricTypesEnum.LENDING_SUPPLY,
    //   from,
    //   to,
    //   value,
    //   daoId,
    //   tokenId,
    //   timestamp,
    // );

    // await updateSupplyMetric(
    //   context,
    //   tokenData,
    //   "cexSupply",
    //   cexAddressList,
    //   MetricTypesEnum.CEX_SUPPLY,
    //   from,
    //   to,
    //   value,
    //   daoId,
    //   tokenId,
    //   timestamp,
    // );

    // await updateSupplyMetric(
    //   context,
    //   tokenData,
    //   "dexSupply",
    //   dexAddressList,
    //   MetricTypesEnum.DEX_SUPPLY,
    //   from,
    //   to,
    //   value,
    //   daoId,
    //   tokenId,
    //   timestamp,
    // );

    // await updateSupplyMetric(
    //   context,
    //   tokenData,
    //   "treasury",
    //   treasuryAddressList,
    //   MetricTypesEnum.TREASURY,
    //   from,
    //   to,
    //   value,
    //   daoId,
    //   tokenId,
    //   timestamp,
    // );

    // await updateTotalSupplyMetric(
    //   context,
    //   tokenData,
    //   burningAddressList,
    //   MetricTypesEnum.TOTAL_SUPPLY,
    //   from,
    //   to,
    //   value,
    //   daoId,
    //   tokenId,
    //   timestamp,
    // );

    // await updateCirculatingSupplyMetric(
    //   context,
    //   tokenData,
    //   MetricTypesEnum.CIRCULATING_SUPPLY,
    //   daoId,
    //   tokenId,
    //   timestamp,
    // );
  });

  ponder.on(
    "NounsToken:Transfer",
    async ({
      event,
      context,
    }: {
      event: Event<"NounsToken:Transfer">;
      context: Context;
    }) => {
      await tokenTransfer(context, daoId, {
        from: event.args.from,
        to: event.args.to,
        token: address,
        transactionHash: event.transaction.hash,
        value: 0n,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      });

      // Handle transaction creation/update with flag calculation
      await handleTransaction(
        context,
        daoId,
        event.transaction.hash,
        event.transaction.from,
        event.transaction.to,
        event.block.timestamp,
        [event.args.from, event.args.to], // Addresses to check
      );
    },
  );

  ponder.on(`NounsToken:DelegateChanged`, async ({ event, context }) => {
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      tokenId: event.log.address,
      fromDelegate: event.args.fromDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      daoId,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.delegator, event.args.toDelegate], // Addresses to check
    );
  });

  ponder.on(`NounsToken:DelegateVotesChanged`, async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      tokenId: event.log.address,
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      daoId,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.delegate], // Address to check
    );
  });
}
