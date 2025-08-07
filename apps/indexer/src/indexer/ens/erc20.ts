import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/eventHandlers";

export function ENSTokenIndexer(
  address: Address,
  decimals: number,
  daoId: DaoIdEnum = DaoIdEnum.ENS,
) {
  ponder.on("ENSToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("ENSToken:Transfer", async ({ event, context }) => {
    await tokenTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      tokenAddress: address,
      transactionHash: event.transaction.hash,
      value: event.args.value,
      timestamp: event.block.timestamp,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on(`ENSToken:DelegateChanged`, async ({ event, context }) => {
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      tokenId: event.log.address,
      fromDelegate: event.args.fromDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on(`ENSToken:DelegateVotesChanged`, async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      tokenId: event.log.address,
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to,
      logIndex: event.log.logIndex,
    });
  });
}
