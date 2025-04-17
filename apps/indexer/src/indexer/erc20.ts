import { ponder } from "ponder:registry";
import { token, dao } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { tokenTransfer } from "@/lib/event-handlers";
import { Governor } from "@/interfaces/governor";

export function ERC20Indexer(
  daoId: DaoIdEnum,
  address: Address,
  decimals: number,
  governor?: Governor,
) {
  ponder.on(`${daoId}Token:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });

    if (governor) {
      const votingPeriod = await governor.getVotingPeriod();
      const quorum = await governor.getQuorum();
      const votingDelay = await governor.getVotingDelay();
      const timelockDelay = await governor.getTimelockDelay();
      const proposalThreshold = await governor.getProposalThreshold();

      await context.db.insert(dao).values({
        id: daoId,
        votingPeriod,
        quorum,
        votingDelay,
        timelockDelay,
        proposalThreshold,
      });
    }
  });

  ponder.on(`${daoId}Token:Transfer`, async ({ event, context }) => {
    await tokenTransfer(event, context, daoId, address);
  });
}
