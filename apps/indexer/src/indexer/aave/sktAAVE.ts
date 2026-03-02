import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address, zeroAddress } from "viem";

import { delegateChanged, tokenTransfer } from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";

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
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      delegate: event.args.delegatee,
      tokenId: event.log.address,
      previousDelegate: zeroAddress,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      type: event.args.delegationType,
    });
  });
}
