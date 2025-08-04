import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";
import { insertEvent } from "@/eventHandlers/shared";

export function ENSTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.ENS;

  ponder.on("ENSToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("ENSToken:Transfer", async ({ event, context }) => {
    await insertEvent(context, event.log.logIndex, event.transaction.hash);
    await tokenTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      tokenAddress: address,
      transactionHash: event.transaction.hash,
      value: event.args.value,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on(`ENSToken:DelegateChanged`, async ({ event, context }) => {
    await insertEvent(context, event.log.logIndex, event.transaction.hash);
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

  ponder.on(`ENSToken:DelegateVotesChanged`, async ({ event, context }) => {
    await insertEvent(context, event.log.logIndex, event.transaction.hash);
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
