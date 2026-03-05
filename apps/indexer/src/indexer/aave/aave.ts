import { ponder } from "ponder:registry";
import {
  transfer,
  accountBalance,
  accountPower,
  balanceHistory,
  delegation,
  token,
  votingPowerHistory,
} from "ponder:schema";
import { Address, getAddress, zeroAddress } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { ensureAccountsExist } from "@/eventHandlers/shared";

export function AAVETokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.AAVE;

  ponder.on(`AAVE:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`AAVE:Transfer`, async ({ event, context }) => {
    const { from: _from, to: _to, value } = event.args;

    const from = getAddress(_from);
    const to = getAddress(_to);
    const tokenId = getAddress(address);

    await ensureAccountsExist(context, [to, from]);

    await context.db
      .insert(transfer)
      .values({
        transactionHash: event.transaction.hash,
        daoId,
        tokenId,
        amount: value,
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
        amount: current.amount + value,
      }));

    const { balance: currentReceiverBalance, delegate: toDelegate } =
      await context.db
        .insert(accountBalance)
        .values({
          accountId: to,
          tokenId: tokenId,
          balance: value,
          delegate: zeroAddress,
        })
        .onConflictDoUpdate((current) => ({
          balance: current.balance + value,
        }));

    if (toDelegate !== zeroAddress) {
      const { votingPower: currentVotingPower } = await context.db
        .insert(accountPower)
        .values({
          accountId: toDelegate,
          daoId,
        })
        .onConflictDoUpdate((current) => ({
          votingPower: current.votingPower + value,
        }));

      await context.db.insert(votingPowerHistory).values({
        daoId,
        transactionHash: event.transaction.hash,
        accountId: toDelegate,
        votingPower: currentVotingPower + value,
        delta: value,
        deltaMod: value,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex + 1,
      });
    }

    await context.db
      .insert(balanceHistory)
      .values({
        daoId,
        transactionHash: event.transaction.hash,
        accountId: to,
        balance: currentReceiverBalance,
        delta: value,
        deltaMod: value > 0n ? value : -value,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      })
      .onConflictDoNothing();

    if (from !== zeroAddress) {
      const { balance: currentSenderBalance, delegate: fromDelegate } =
        await context.db
          .insert(accountBalance)
          .values({
            accountId: from,
            tokenId: tokenId,
            balance: -value,
            delegate: zeroAddress,
          })
          .onConflictDoUpdate((current) => ({
            balance: current.balance - value,
          }));

      if (fromDelegate !== zeroAddress) {
        const { votingPower: currentVotingPower } = await context.db
          .insert(accountPower)
          .values({
            accountId: fromDelegate,
            daoId,
          })
          .onConflictDoUpdate((current) => ({
            votingPower: current.votingPower - value,
          }));

        await context.db.insert(votingPowerHistory).values({
          daoId,
          transactionHash: event.transaction.hash,
          accountId: fromDelegate,
          votingPower: currentVotingPower - value,
          delta: -value,
          deltaMod: value > 0n ? value : -value,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex + 1,
        });
      }

      await context.db
        .insert(balanceHistory)
        .values({
          daoId,
          transactionHash: event.transaction.hash,
          accountId: from,
          balance: currentSenderBalance,
          delta: -value,
          deltaMod: value > 0n ? value : -value,
          timestamp: event.block.timestamp,
          logIndex: event.log.logIndex,
        })
        .onConflictDoNothing();
    }
  });

  ponder.on(`AAVE:DelegateChanged`, async ({ event, context }) => {
    if (event.args.delegationType === 1) {
      // proposal delegation
      return;
    }

    const delegator = getAddress(event.args.delegator);
    const delegate = getAddress(event.args.delegatee);
    const tokenId = getAddress(address);

    await ensureAccountsExist(context, [delegator, delegate]);

    const previousDelegate =
      (
        await context.db.find(accountBalance, {
          accountId: delegator,
          tokenId,
        })
      )?.delegate ?? zeroAddress;

    const redelegation = previousDelegate !== zeroAddress;

    const delegatorBalance = await context.db
      .insert(accountBalance)
      .values({
        accountId: delegator,
        tokenId,
        delegate: delegate,
        balance: 0n,
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

    if (delegate !== zeroAddress) {
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
          logIndex: event.log.logIndex + 1,
        })
        .onConflictDoNothing();
    }

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
          logIndex: event.log.logIndex + 1,
        })
        .onConflictDoNothing();
    }
  });
}
