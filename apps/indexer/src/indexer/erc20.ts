import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { tokenTransfer } from "@/lib/event-handlers";

export function ERC20Indexer(
  daoId: DaoIdEnum,
  address: Address,
  decimals: number,
) {
  ponder.on(`${daoId}Token:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`${daoId}Token:Transfer`, async ({ event, context }) => {
    await tokenTransfer(event, context, daoId, address);
  });
}
