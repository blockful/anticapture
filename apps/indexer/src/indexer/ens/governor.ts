import { ponder } from "ponder:registry";

import {
  updateProposalStatus,
  proposalCreated,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { DAOClient } from "@/interfaces/client";
import { dao } from "ponder:schema";
import { ProposalStatus } from "@/lib/constants";

export function GovernorIndexer(client: DAOClient, blockTime: number) {
  const daoId = DaoIdEnum.ENS;

  ponder.on(`ENSGovernor:setup`, async ({ context }) => {
    const [
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    ] = await Promise.all([
      client.getVotingPeriod(),
      client.getQuorum(null),
      client.getVotingDelay(),
      client.getTimelockDelay(),
      client.getProposalThreshold(),
    ]);
    await context.db.insert(dao).values({
      id: daoId,
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    });
  });

  ponder.on(`ENSGovernor:VoteCast`, async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      reason: event.args.reason,
      support: event.args.support,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: event.args.weight,
    });
  });

  ponder.on(`ENSGovernor:ProposalCreated`, async ({ event, context }) => {
    await proposalCreated(context, daoId, blockTime, {
      proposalId: event.args.proposalId.toString(),
      txHash: event.transaction.hash,
      proposer: event.args.proposer,
      targets: [...event.args.targets],
      values: [...event.args.values],
      signatures: [...event.args.signatures],
      calldatas: [...event.args.calldatas],
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on(`ENSGovernor:ProposalCanceled`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on(`ENSGovernor:ProposalExecuted`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on(`ENSGovernor:ProposalQueued`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.QUEUED,
    );
  });
}
