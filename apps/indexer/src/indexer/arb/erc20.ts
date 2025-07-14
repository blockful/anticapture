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
    const e = event as any;

    await tokenTransfer(context, daoId, {
      from: e.args.from,
      to: e.args.to,
      tokenAddress: address,
      transactionHash: e.transaction.hash,
      value: e.args.value,
      timestamp: e.block.timestamp,
    });
  });
}
