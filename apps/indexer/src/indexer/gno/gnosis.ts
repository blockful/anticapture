import { ponder } from "ponder:registry";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";

import { gnoSetup, gnoTransfer } from "./shared";

export function GNOTokenGnosisIndexer(
  address: Address,
  decimals: number,
  daoId: DaoIdEnum = DaoIdEnum.GNO,
) {
  ponder.on("GNOTokenGnosis:setup", async ({ context }) => {
    await gnoSetup(context, address, daoId, decimals);
  });

  ponder.on(
    "GNOTokenGnosis:Transfer(address indexed from, address indexed to, uint256 value, bytes data)",
    async ({ event, context }) => {
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
    },
  );
}
