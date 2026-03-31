import { ponder } from "ponder:registry";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  NonCirculatingAddresses,
  TreasuryAddresses,
} from "@/lib/constants";
import { createAddressSet } from "@/eventHandlers/shared";
import { aaveSetup, aaveTransfer, aaveDelegateChanged } from "./shared";

export function AAVETokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.AAVE;
  const addressSets = {
    cex: createAddressSet(Object.values(CEXAddresses[daoId])),
    dex: createAddressSet(Object.values(DEXAddresses[daoId])),
    lending: createAddressSet(Object.values(LendingAddresses[daoId])),
    treasury: createAddressSet(Object.values(TreasuryAddresses[daoId])),
    nonCirculating: createAddressSet(
      Object.values(NonCirculatingAddresses[daoId]),
    ),
    burning: createAddressSet(Object.values(BurningAddresses[daoId])),
  };

  ponder.on(`AAVE:setup`, async ({ context }) => {
    await aaveSetup(context, address, daoId, decimals);
  });

  ponder.on(`AAVE:Transfer`, async ({ event, context }) => {
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
      addressSets,
    );
  });

  ponder.on(`v3AAVE:DelegateChanged`, async ({ event, context }) => {
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
