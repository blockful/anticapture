import { accountBalance, accountPower, delegation, token } from "ponder:schema";
import { ponder } from "ponder:registry";
import { Address, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { delegatedVotesChanged, tokenTransfer } from "@/eventHandlers";
import { ensureAccountsExist, handleTransaction } from "@/eventHandlers/shared";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  TreasuryAddresses,
} from "@/lib/constants";
import {
  updateSupplyMetric,
  updateTotalSupply,
  updateCirculatingSupply,
  updateDelegatedSupply,
} from "@/eventHandlers/metrics";

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
    const { from, to, value } = event.args;
    const { timestamp } = event.block;

    const cexAddressList = Object.values(CEXAddresses[daoId]);
    const dexAddressList = Object.values(DEXAddresses[daoId]);
    const lendingAddressList = Object.values(LendingAddresses[daoId]);
    const burningAddressList = Object.values(BurningAddresses[daoId]);
    const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);

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
      value,
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
      value,
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
      value,
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
      value,
      daoId,
      address,
      timestamp,
    );

    await updateTotalSupply(
      context,
      burningAddressList,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateCirculatingSupply(
      context,
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
    );
  });

  ponder.on(`SCRToken:DelegateChanged`, async ({ event, context }) => {
    // TODO: Adjust delegation data model to allow for partial delegation natively
    // Process the delegation change

    // Pre-compute address lists for flag determination
    const lendingAddressList = Object.values(LendingAddresses[daoId] || {});
    const cexAddressList = Object.values(CEXAddresses[daoId] || {});
    const dexAddressList = Object.values(DEXAddresses[daoId] || {});
    const burningAddressList = Object.values(BurningAddresses[daoId] || {});

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

      if (!delegatorBalance && delegator !== zeroAddress /* token coinbase */) {
        return;
      }

      const delegatorBalanceValue = delegatorBalance
        ? delegatorBalance.balance
        : 0n;

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
          delegatedValue: (delegatorBalanceValue * BigInt(percentage)) / 10000n, // `percentage` is informed in basis points, wherein 100% (percentage) = 1 (decimal) = 10000 (basis)
          timestamp,
          logIndex,
          isCex,
          isDex,
          isLending,
          isTotal,
        })
        .onConflictDoUpdate((current) => ({
          delegatedValue: current.delegatedValue + delegatorBalanceValue,
        }));

      // Transaction flag updates moved to DAO-specific indexer

      // Update the delegator's delegate
      await context.db
        .insert(accountBalance)
        .values({
          accountId: delegator,
          tokenId,
          delegate: delegate,
          balance: delegatorBalanceValue,
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

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [
        ...event.args.newDelegatees.map(({ _delegatee }) => _delegatee),
        ...event.args.oldDelegatees.map(({ _delegatee }) => _delegatee),
      ],
    );
  });

  ponder.on(`SCRToken:DelegateVotesChanged`, async ({ event, context }) => {
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
