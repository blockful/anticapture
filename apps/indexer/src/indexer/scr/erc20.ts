import { accountBalance, accountPower, delegation, token } from "ponder:schema";
import { ponder } from "ponder:registry";
import { Address, getAddress, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { delegatedVotesChanged, tokenTransfer } from "@/eventHandlers";
import {
  createAddressSet,
  ensureAccountsExist,
  handleTransaction,
} from "@/eventHandlers/shared";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import {
  updateSupplyMetric,
  updateTotalSupply,
  updateCirculatingSupply,
  updateDelegatedSupply,
} from "@/eventHandlers/metrics";

export function SCRTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.SCR;
  const cexAddressSet = createAddressSet(Object.values(CEXAddresses[daoId]));
  const dexAddressSet = createAddressSet(Object.values(DEXAddresses[daoId]));
  const lendingAddressSet = createAddressSet(
    Object.values(LendingAddresses[daoId]),
  );
  const burningAddressSet = createAddressSet(
    Object.values(BurningAddresses[daoId]),
  );
  const treasuryAddressSet = createAddressSet(
    Object.values(TreasuryAddresses[daoId]),
  );
  const nonCirculatingAddressSet = createAddressSet(
    Object.values(NonCirculatingAddresses[daoId]),
  );

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
        lending: lendingAddressSet,
        burning: burningAddressSet,
      },
    );

    const lendingChanged = await updateSupplyMetric(
      context,
      "lendingSupply",
      lendingAddressSet,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
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
      lendingChanged ||
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
    );
  });

  ponder.on(`SCRToken:DelegateChanged`, async ({ event, context }) => {
    // TODO: Adjust delegation data model to allow for partial delegation natively
    // Process the delegation change

    const { delegator } = event.args;
    const { address: tokenId, logIndex } = event.log;
    const { hash: txHash } = event.transaction;
    const { timestamp } = event.block;

    const normalizedDelegator = getAddress(delegator);
    const normalizedTokenId = getAddress(tokenId);

    for (const { _delegatee: delegate, _numerator: percentage } of event.args
      .newDelegatees) {
      const normalizedDelegate = getAddress(delegate);

      // Ensure all required accounts exist in parallel
      await ensureAccountsExist(context, [delegator, delegate]);

      // Get the delegator's current balance
      const delegatorBalance = await context.db.find(accountBalance, {
        accountId: normalizedDelegator,
        tokenId: normalizedTokenId,
      });

      if (!delegatorBalance && delegator !== zeroAddress /* token coinbase */) {
        return;
      }

      const delegatorBalanceValue = delegatorBalance
        ? delegatorBalance.balance
        : 0n;

      // Determine flags for the delegation
      const isCex =
        cexAddressSet.has(normalizedDelegator) ||
        cexAddressSet.has(normalizedDelegate);
      const isDex =
        dexAddressSet.has(normalizedDelegator) ||
        dexAddressSet.has(normalizedDelegate);
      const isLending =
        lendingAddressSet.has(normalizedDelegator) ||
        lendingAddressSet.has(normalizedDelegate);
      const isBurning =
        burningAddressSet.has(normalizedDelegator) ||
        burningAddressSet.has(normalizedDelegate);
      const isTotal = isBurning;

      await context.db
        .insert(delegation)
        .values({
          transactionHash: txHash,
          daoId,
          delegateAccountId: normalizedDelegate,
          delegatorAccountId: normalizedDelegator,
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
          accountId: normalizedDelegator,
          tokenId: normalizedTokenId,
          delegate: normalizedDelegate,
          balance: delegatorBalanceValue,
        })
        .onConflictDoUpdate({
          delegate: normalizedDelegate,
        });

      // Update the delegate's delegations count
      await context.db
        .insert(accountPower)
        .values({
          accountId: normalizedDelegate,
          daoId,
          delegationsCount: 1,
        })
        .onConflictDoUpdate((current) => ({
          delegationsCount: current.delegationsCount + 1,
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
