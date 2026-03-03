import { ponder } from "ponder:registry";
import { accountBalance, accountPower, delegation, token } from "ponder:schema";
import { Address, getAddress, zeroAddress } from "viem";

import { tokenTransfer } from "@/eventHandlers";
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

  ponder.on(`AAVE:DelegateChanged`, async ({ event, context }) => {
    const delegator = getAddress(event.args.delegator);
    const delegate = getAddress(event.args.delegatee);

    await ensureAccountsExist(context, [delegator, delegate]);

    const delegatorBalance = await context.db.find(accountBalance, {
      accountId: delegator,
      tokenId: getAddress(address),
    });

    await context.db
      .insert(delegation)
      .values({
        transactionHash: event.transaction.hash,
        daoId,
        delegateAccountId: delegate,
        delegatorAccountId: delegator,
        delegatedValue: delegatorBalance?.balance ?? 0n,
        previousDelegate: zeroAddress,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
        isCex: false,
        isDex: false,
        isLending: false,
        isTotal: false,
        type: event.args.delegationType,
      })
      .onConflictDoUpdate((current) => ({
        delegatedValue:
          current.delegatedValue + (delegatorBalance?.balance ?? 0n),
      }));

    await context.db
      .insert(accountBalance)
      .values({
        accountId: delegator,
        tokenId: getAddress(address),
        delegate: delegate,
        balance: BigInt(0),
      })
      .onConflictDoUpdate({
        delegate: delegate,
      });

    await context.db
      .insert(accountPower)
      .values({
        accountId: delegate,
        daoId,
        delegationsCount: 1,
      })
      .onConflictDoUpdate((current) => ({
        delegationsCount: current.delegationsCount + 1,
      }));
  });
}
