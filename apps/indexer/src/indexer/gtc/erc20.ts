import { Context, Event, ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";

export function GTCTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.GTC;

  ponder.on("GTCToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(
    "GTCToken:Transfer",
    async ({
      event,
      context,
    }: {
      event: Event<"GTCToken:Transfer">;
      context: Context;
    }) => {
      await tokenTransfer(context, daoId, {
        from: event.args.from,
        to: event.args.to,
        tokenAddress: address,
        transactionHash: event.transaction.hash,
        value: event.args.amount,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      });
    },
  );

  ponder.on(`GTCToken:DelegateChanged`, async ({ event, context }) => {
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      tokenId: event.log.address,
      fromDelegate: event.args.fromDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on(`GTCToken:DelegateVotesChanged`, async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      tokenId: event.log.address,
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });
}
