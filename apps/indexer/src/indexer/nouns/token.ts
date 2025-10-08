import { Context, Event, ponder } from "ponder:registry";
import { accountBalance, token, transfer } from "ponder:schema";
import { Address, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { delegateChanged, delegatedVotesChanged } from "@/eventHandlers";
import {
  ensureAccountExists,
  handleTransaction,
  storeDailyBucket,
} from "@/eventHandlers/shared";
import { MetricTypesEnum } from "@/lib/constants";

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
      const { to, from, tokenId: _tokenId } = event.args;
      const tokenId = _tokenId.toString();

      await ensureAccountExists(context, to);
      await ensureAccountExists(context, from);

      await context.db
        .insert(accountBalance)
        .values({
          accountId: to,
          tokenId,
          balance: 1n,
          delegate: zeroAddress,
        })
        .onConflictDoUpdate((current) => ({
          balance: current.balance + 1n,
        }));

      // Update the from account's balance (skip if minting from zero address)
      if (from !== zeroAddress) {
        await context.db
          .update(accountBalance, {
            tokenId,
            accountId: from,
          })
          .set({
            balance: -1n,
          });
      }
      await context.db
        .insert(transfer)
        .values({
          transactionHash: event.transaction.hash,
          daoId,
          tokenId,
          amount: 1n,
          fromAccountId: from,
          toAccountId: to,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex,
          isCex: false,
          isDex: false,
          isLending: false,
          isTotal: false,
        })
        .onConflictDoUpdate((current) => ({
          amount: current.amount + 1n,
        }));

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
