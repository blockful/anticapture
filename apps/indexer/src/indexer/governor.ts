import { ponder } from "ponder:registry";

import {
  delegateChanged,
  delegatedVotesChanged,
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  voteCast,
} from "@/lib/event-handlers";
import { DaoIdEnum } from "@/lib/enums";
import { Governor } from "@/interfaces/governor";
import { dao } from "ponder:schema";

export function GovernorIndexer(daoId: DaoIdEnum, governor: Governor) {
  ponder.on(`${daoId}Governor:setup`, async ({ context }) => {
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
  });

  ponder.on(`${daoId}Governor:VoteCast`, async ({ event, context }) => {
    await voteCast(event, context, daoId);
  });

  /**
   * Handler for ProposalCreated event of UNIGovernor contract
   * Creates a new ProposalsOnchain record and updates the proposer's proposal count
   */
  ponder.on(`${daoId}Governor:ProposalCreated`, async ({ event, context }) => {
    await proposalCreated(event, context, daoId);
  });

  /**
   * Handler for ProposalCanceled event of UNIGovernor contract
   * Updates the status of a proposal to CANCELED
   */
  ponder.on(`${daoId}Governor:ProposalCanceled`, async ({ event, context }) => {
    await proposalCanceled(event, context, daoId);
  });

  /**
   * Handler for ProposalExecuted event of UNIGovernor contract
   * Updates the status of a proposal to EXECUTED
   */
  ponder.on(`${daoId}Governor:ProposalExecuted`, async ({ event, context }) => {
    await proposalExecuted(event, context, daoId);
  });

  ponder.on(`${daoId}Token:DelegateChanged`, async ({ event, context }) => {
    await delegateChanged(event, context, daoId);
  });

  ponder.on(
    `${daoId}Token:DelegateVotesChanged`,
    async ({ event, context }) => {
      await delegatedVotesChanged(event, context, daoId);
    }
  );
}
