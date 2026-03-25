import { Context, Event, ponder } from "ponder:registry";
import { accountBalance, token } from "ponder:schema";
import { Address, isAddressEqual, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import { createAddressSet, handleTransaction } from "@/eventHandlers/shared";
import {
  BurningAddresses,
  MetricTypesEnum,
  TreasuryAddresses,
} from "@/lib/constants";
import {
  updateCirculatingSupply,
  updateDelegatedSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function LilNounsTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.LIL_NOUNS;
  const timelock = TreasuryAddresses[daoId].timelock!;
  const burningAddressSet = createAddressSet(
    Object.values(BurningAddresses[daoId]),
  );
  const treasuryAddressSet = createAddressSet(
    Object.values(TreasuryAddresses[daoId]),
  );
  const delegationAddressSets = {
    cex: createAddressSet([]),
    dex: createAddressSet([]),
    lending: createAddressSet([]),
    burning: burningAddressSet,
  };

  ponder.on("LilNounsToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(
    "LilNounsToken:Transfer",
    async ({
      event,
      context,
    }: {
      event: Event<"LilNounsToken:Transfer">;
      context: Context;
    }) => {
      const { from, to } = event.args;

      // Auto-self-delegate for Lil Nouns when no explicit delegate is set
      const toBal = await context.db.find(accountBalance, {
        accountId: event.args.to,
        tokenId: event.log.address,
      });

      if (toBal?.delegate === zeroAddress) {
        await delegateChanged(
          context,
          daoId,
          {
            delegator: event.args.to,
            delegate: event.args.to,
            tokenId: event.log.address,
            previousDelegate: zeroAddress,
            txHash: event.transaction.hash,
            timestamp: event.block.timestamp,
            logIndex: event.log.logIndex,
          },
          delegationAddressSets,
        );
      }

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
          burning: burningAddressSet,
        },
      );

      const isFromTimelock = isAddressEqual(event.args.from, timelock);
      const isToTimelock = isAddressEqual(event.args.to, timelock);

      if (isFromTimelock || isToTimelock) {
        const treasuryChanged = await updateSupplyMetric(
          context,
          "treasury",
          treasuryAddressSet,
          MetricTypesEnum.TREASURY,
          zeroAddress,
          timelock,
          isFromTimelock ? -1n : 1n,
          daoId,
          address,
          event.block.timestamp,
        );

        if (treasuryChanged) {
          await updateCirculatingSupply(
            context,
            daoId,
            address,
            event.block.timestamp,
          );
        }
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

  ponder.on(`LilNounsToken:NounCreated`, async ({ event, context }) => {
    await updateTotalSupply(
      context,
      burningAddressSet,
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

  ponder.on(`LilNounsToken:DelegateChanged`, async ({ event, context }) => {
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
      [event.args.delegator, event.args.toDelegate],
    );
  });

  ponder.on(
    `LilNounsToken:DelegateVotesChanged`,
    async ({ event, context }) => {
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
    },
  );
}
