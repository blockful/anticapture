import { ponder } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  delegation,
  token,
  votingPowerHistory,
} from "ponder:schema";
import { Address, getAddress, zeroAddress } from "viem";

import { tokenTransfer } from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { ensureAccountsExist } from "@/eventHandlers/shared";

export function sktAaveTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.AAVE;

  ponder.on(`stkAAVE:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`stkAAVE:Transfer`, async ({ event, context }) => {
    const { from, to, value } = event.args;

    await tokenTransfer(
      context,
      daoId,
      {
        from,
        to,
        value,
        token: address,
        transactionHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      {},
    );
  });

  ponder.on(`stkAAVE:DelegateChanged`, async ({ event, context }) => {
    if (event.args.delegationType === 1) {
      // proposal delegation
      return;
    }

    const delegator = getAddress(event.args.delegator);
    const delegate = getAddress(event.args.delegatee);
    const tokenId = getAddress(address);

    await ensureAccountsExist(context, [delegator, delegate]);

    const previousDelegate = (await context.db.find(accountBalance, {
      accountId: delegator,
      tokenId,
    }))!.delegate;

    const redelegation = previousDelegate !== zeroAddress;

    const delegatorBalance = await context.db
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

    await context.db
      .insert(delegation)
      .values({
        transactionHash: event.transaction.hash,
        daoId,
        delegateAccountId: delegate,
        delegatorAccountId: delegator,
        delegatedValue: delegatorBalance.balance,
        previousDelegate,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
        isCex: false,
        isDex: false,
        isLending: false,
        isTotal: false,
        type: event.args.delegationType,
      })
      .onConflictDoUpdate((current) => ({
        delegatedValue: current.delegatedValue + delegatorBalance.balance,
      }));

    await context.db
      .insert(accountPower)
      .values({
        accountId: delegate,
        daoId,
        delegationsCount: 1,
        votingPower: delegatorBalance.balance,
      })
      .onConflictDoUpdate((current) => ({
        delegationsCount: current.delegationsCount + 1,
        votingPower: current.votingPower + delegatorBalance.balance,
      }));

    if (redelegation) {
      const previousVp = await context.db
        .update(accountPower, { accountId: previousDelegate })
        .set((current) => ({
          delegationsCount: current.delegationsCount - 1,
          votingPower: current.votingPower - delegatorBalance.balance,
        }));

      await context.db
        .insert(votingPowerHistory)
        .values({
          daoId,
          transactionHash: event.transaction.hash,
          accountId: previousDelegate,
          votingPower: previousVp.votingPower - delegatorBalance.balance,
          delta: -delegatorBalance.balance,
          deltaMod: delegatorBalance.balance,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex,
        })
        .onConflictDoNothing();
    }

    await context.db
      .insert(votingPowerHistory)
      .values({
        daoId,
        transactionHash: event.transaction.hash,
        accountId: delegate,
        votingPower: delegatorBalance.balance,
        delta: delegatorBalance.balance,
        deltaMod: delegatorBalance.balance,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      })
      .onConflictDoNothing();
  });
}
