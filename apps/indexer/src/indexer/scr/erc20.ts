import { accountBalance, accountPower, delegation, token } from "ponder:schema";
import { ponder } from "ponder:registry";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { delegatedVotesChanged, tokenTransfer } from "@/eventHandlers";
import { ensureAccountsExist, handleTransaction } from "@/eventHandlers/shared";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
} from "@/lib/constants";

export function SCRTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.SCR;

  ponder.on(`SCRToken:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`SCRToken:Transfer`, async ({ event, context }) => {
    // Process the transfer
    await tokenTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      tokenAddress: address,
      transactionHash: event.transaction.hash,
      value: event.args.value,
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
  });

  ponder.on(`SCRToken:DelegateChanged`, async ({ event, context }) => {
    // TODO: Adjust delegation data model to allow for partial delegation natively
    // Process the delegation change

    for (const { _delegatee: delegate, _numerator: percentage } of event.args
      .newDelegatees) {
      const { delegator } = event.args;
      const { address: tokenId, logIndex: logIndex } = event.log;
      const { hash: txHash } = event.transaction;
      const { timestamp } = event.block;

      // Ensure all required accounts exist in parallel
      await ensureAccountsExist(context, [delegator, delegate]);

      // Get the delegator's current balance
      const delegatorBalance = await context.db.find(accountBalance, {
        accountId: delegator,
        tokenId,
      });

      // Pre-compute address lists for flag determination
      const lendingAddressList = Object.values(
        LendingAddresses[daoId as DaoIdEnum] || {},
      );
      const cexAddressList = Object.values(
        CEXAddresses[daoId as DaoIdEnum] || {},
      );
      const dexAddressList = Object.values(
        DEXAddresses[daoId as DaoIdEnum] || {},
      );
      const burningAddressList = Object.values(
        BurningAddresses[daoId as DaoIdEnum] || {},
      );

      // Determine flags for the delegation
      const isCex =
        cexAddressList.includes(delegator) || cexAddressList.includes(delegate);
      const isDex =
        dexAddressList.includes(delegator) || dexAddressList.includes(delegate);
      const isLending =
        lendingAddressList.includes(delegator) ||
        lendingAddressList.includes(delegate);
      const isBurning =
        burningAddressList.includes(delegator) ||
        burningAddressList.includes(delegate);
      const isTotal = isBurning;

      await context.db
        .insert(delegation)
        .values({
          transactionHash: txHash,
          daoId,
          delegateAccountId: delegate,
          delegatorAccountId: delegator,
          delegatedValue: delegatorBalance
            ? (delegatorBalance.balance * BigInt(percentage)) / 10000n
            : 0n,
          timestamp,
          logIndex,
          isCex,
          isDex,
          isLending,
          isTotal,
        })
        .onConflictDoUpdate((current) => ({
          delegatedValue:
            current.delegatedValue + (delegatorBalance?.balance ?? 0n),
        }));

      // Transaction flag updates moved to DAO-specific indexer

      // Update the delegator's delegate
      await context.db
        .insert(accountBalance)
        .values({
          accountId: delegator,
          tokenId,
          delegate: delegate,
          balance: BigInt(0),
        })
        .onConflictDoUpdate({
          delegate: delegate,
        });

      // Update the delegate's delegations count
      await context.db
        .insert(accountPower)
        .values({
          accountId: delegate,
          daoId,
          delegationsCount: 1,
        })
        .onConflictDoUpdate((current) => ({
          delegationsCount: (current.delegationsCount ?? 0) + 1,
        }));
    }
    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      daoId,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [
        ...event.args.newDelegatees.map(({ _delegatee }) => _delegatee),
        ...event.args.oldDelegatees.map(({ _delegatee }) => _delegatee),
      ], // Addresses to check
    );
  });

  ponder.on(`SCRToken:DelegateVotesChanged`, async ({ event, context }) => {
    // Process the delegate votes change
    await delegatedVotesChanged(context, daoId, {
      tokenId: event.log.address,
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newVotes,
      oldBalance: event.args.previousVotes,
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
