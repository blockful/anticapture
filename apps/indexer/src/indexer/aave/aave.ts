import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { tokenTransfer } from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";

export function AaveTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.AAVE;

  /*-------------------- AAVE --------------------*/

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

  /*-------------------- stkAAVE --------------------*/

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

  /*-------------------- aAAVE --------------------*/

  ponder.on(`aAAVE:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`aAAVE:Transfer`, async ({ event, context }) => {
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
}
