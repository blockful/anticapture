import { Context, Event, ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address, isAddressEqual, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import { handleTransaction } from "@/eventHandlers/shared";
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
  const timelock = TreasuryAddresses[daoId].timelock!;

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
          burning: Object.values(BurningAddresses[daoId]),
        },
      );

      const isFromTimelock = isAddressEqual(event.args.from, timelock);
      const isToTimelock = isAddressEqual(event.args.to, timelock);

      if (isFromTimelock || isToTimelock) {
        await updateSupplyMetric(
          context,
          "treasury",
          Object.values(TreasuryAddresses[daoId]),
          MetricTypesEnum.TREASURY,
          zeroAddress,
          timelock,
          isFromTimelock ? -1n : 1n,
          daoId,
          address,
          event.block.timestamp,
        );
      }

      const isToZeroAddress = isAddressEqual(event.args.to, zeroAddress);

      // Delegating to zero address is equivalent to self-delegation
      if (isToZeroAddress) {
        await delegatedVotesChanged(context, daoId, {
          delegate: event.args.from,
          txHash: event.transaction.hash,
          newBalance: 1n,
          oldBalance: 0n,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex,
        });
      }
      if (!event.transaction.to) return;

      await handleTransaction(
        context,
        event.transaction.hash,
        event.transaction.from,
        event.transaction.to,
        event.block.timestamp,
        [event.args.from, event.args.to],
      );
    },
  );

  ponder.on(`NounsToken:NounCreated`, async ({ event, context }) => {
    await updateTotalSupply(
      context,
      Object.values(BurningAddresses[daoId]),
      MetricTypesEnum.TOTAL_SUPPLY,
      zeroAddress,
      timelock,
      1n,
      daoId,
      address,
      event.block.timestamp,
    );

    await updateDelegatedSupply(
      context,
      daoId,
      address,
      1n,
      event.block.timestamp,
    );
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
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.delegator, event.args.toDelegate],
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

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.delegate],
    );
  });
}
