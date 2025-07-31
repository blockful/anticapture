import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { tokenTransfer } from "@/eventHandlers";

export function ARBTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.ARB;

  ponder.on(`ARBToken:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`ARBToken:Transfer`, async ({ event, context }) => {
    await tokenTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      tokenAddress: address,
      transactionHash: event.transaction.hash,
      value: event.args.value,
      timestamp: event.block.timestamp,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to,
      logIndex: BigInt(event.log.logIndex),
    });
  });
}
