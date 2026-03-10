import { ponder } from "ponder:registry";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { aaveSetup, aaveTransfer, aaveDelegateChanged } from "./shared";

export function stkAAVETokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.AAVE;

  ponder.on(`stkAAVE:setup`, async ({ context }) => {
    await aaveSetup(context, address, daoId, decimals);
  });

  ponder.on(`stkAAVE:Transfer`, async ({ event, context }) => {
    await aaveTransfer(
      context,
      {
        from: event.args.from,
        to: event.args.to,
        value: event.args.value,
        transactionHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      address,
      daoId,
    );
  });

  ponder.on(`stkAAVE:DelegateChanged`, async ({ event, context }) => {
    await aaveDelegateChanged(
      context,
      {
        delegationType: event.args.delegationType,
        delegator: event.args.delegator,
        delegatee: event.args.delegatee,
        transactionHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      address,
      daoId,
    );
  });
}
