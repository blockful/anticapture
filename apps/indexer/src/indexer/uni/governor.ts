import { ponder } from "ponder:registry";

import {
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  voteCast,
  delegateChanged,
  delegatedVotesChanged,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { Governor } from "@/interfaces/governor";
import { dao } from "ponder:schema";

export function GovernorIndexer(governor: Governor) {
  const daoId = DaoIdEnum.UNI;

  ponder.on("UNIGovernor:setup", async ({ context }) => {
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

  ponder.on("UNIGovernor:VoteCast", async ({ event, context }) => {
    await voteCast(event, context, daoId);
  });

  ponder.on("UNIGovernor:ProposalCreated", async ({ event, context }) => {
    await proposalCreated(event, context, daoId);
  });

  ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
    await proposalCanceled(event, context, daoId);
  });

  ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
    await proposalExecuted(event, context, daoId);
  });

  ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
    await delegateChanged(event, context, daoId);
  });

  ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
    await delegatedVotesChanged(event, context, daoId);
  });
}
