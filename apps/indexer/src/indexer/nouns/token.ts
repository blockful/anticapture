import { Context, Event, ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import { handleTransaction, storeDailyBucket } from "@/eventHandlers/shared";
import {
  BurningAddresses,
  MetricTypesEnum,
  TreasuryAddresses,
} from "@/lib/constants";
import {
  updateDelegatedSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function NounsTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.NOUNS;

  ponder.on("NounsToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
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
      const { from, to } = event.args;
      const { timestamp } = event.block;

      const tokenData = await context.db.find(token, {
        id: address,
      });

      if (!tokenData) {
        return;
      }

      const burningAddressList = Object.values(BurningAddresses[daoId]);

      await tokenTransfer(
        context,
        daoId,
        {
          from,
          to,
          value: 1n,
          token: address,
          transactionHash: event.transaction.hash,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex,
        },
        {
          burning: burningAddressList,
        },
      );

      await updateSupplyMetric(
        context,
        tokenData,
        "treasury",
        Object.values(TreasuryAddresses[daoId]),
        MetricTypesEnum.TREASURY,
        from,
        to,
        1n,
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
        1n,
        daoId,
        address,
        timestamp,
      );

      if (!event.transaction.to) return;

      await handleTransaction(
        context,
        daoId,
        event.transaction.hash,
        event.transaction.from,
        event.transaction.to,
        event.block.timestamp,
        [event.args.from, event.args.to],
      );
    },
  );

  ponder.on(`NounsToken:NounCreated`, async ({ event, context }) => {
    const tokenData = await context.db.find(token, {
      id: event.args.tokenId.toString(),
    });

    if (!tokenData) {
      return;
    }

    await storeDailyBucket(
      context,
      MetricTypesEnum.TOTAL_SUPPLY,
      tokenData.totalSupply,
      tokenData.totalSupply + 1n,
      daoId,
      event.block.timestamp,
      address,
    );
  });

  ponder.on(`NounsToken:NounBurned`, async ({ event, context }) => {
    const tokenData = await context.db.find(token, {
      id: event.args.tokenId.toString(),
    });

    if (!tokenData) {
      return;
    }

    await storeDailyBucket(
      context,
      MetricTypesEnum.TOTAL_SUPPLY,
      tokenData.totalSupply,
      tokenData.totalSupply - 1n,
      daoId,
      event.block.timestamp,
      address,
    );

    // TODO should this be removed from the delegated supply?
  });

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

    if (!event.transaction.to) return;

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
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });

    if (event.transaction.to !== TreasuryAddresses[daoId].timelock) {
      await updateDelegatedSupply(context, daoId, {
        tokenId: event.log.address,
        newBalance: event.args.newBalance,
        oldBalance: event.args.previousBalance,
        timestamp: event.block.timestamp,
      });
    }

    if (!event.transaction.to) return;

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
