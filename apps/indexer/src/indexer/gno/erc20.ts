import { ponder } from "ponder:registry";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";

import {
  gnoSetup,
  gnoTransfer,
  gnoDelegateChanged,
  gnoDelegateVotesChanged,
} from "./shared";

export function GNOTokenIndexer(
  address: Address,
  decimals: number,
  daoId: DaoIdEnum = DaoIdEnum.GNO,
) {
  ponder.on("GNOToken:setup", async ({ context }) => {
    await gnoSetup(context, address, daoId, decimals);
  });

  ponder.on("GNOToken:Transfer", async ({ event, context }) => {
    await gnoTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      value: event.args.value,
      token: address,
      transactionHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to ?? null,
    });
  });

  ponder.on("GNOToken:DelegateChanged", async ({ event, context }) => {
    await gnoDelegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      fromDelegate: event.args.fromDelegate,
      tokenId: event.log.address,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to ?? null,
    });
  });

  ponder.on("GNOToken:DelegateVotesChanged", async ({ event, context }) => {
    await gnoDelegateVotesChanged(context, daoId, {
      delegate: event.args.delegate,
      newBalance: event.args.newBalance,
      previousBalance: event.args.previousBalance,
      logAddress: event.log.address,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to ?? null,
    });
  });
}

export function GNOTokenGnosisIndexer(
  address: Address,
  decimals: number,
  daoId: DaoIdEnum = DaoIdEnum.GNO,
) {
  ponder.on("GNOTokenGnosis:setup", async ({ context }) => {
    await gnoSetup(context, address, daoId, decimals);
  });

  ponder.on("GNOTokenGnosis:Transfer", async ({ event, context }) => {
    await gnoTransfer(context, daoId, {
      from: event.args.from,
      to: event.args.to,
      value: event.args.value,
      token: address,
      transactionHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to ?? null,
    });
  });

  ponder.on("GNOTokenGnosis:DelegateChanged", async ({ event, context }) => {
    await gnoDelegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      fromDelegate: event.args.fromDelegate,
      tokenId: event.log.address,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
      logIndex: event.log.logIndex,
      transactionFrom: event.transaction.from,
      transactionTo: event.transaction.to ?? null,
    });
  });

  ponder.on(
    "GNOTokenGnosis:DelegateVotesChanged",
    async ({ event, context }) => {
      await gnoDelegateVotesChanged(context, daoId, {
        delegate: event.args.delegate,
        newBalance: event.args.newBalance,
        previousBalance: event.args.previousBalance,
        logAddress: event.log.address,
        txHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
        transactionFrom: event.transaction.from,
        transactionTo: event.transaction.to ?? null,
      });
    },
  );
}
