import { ponder } from "ponder:registry";

import {
  proposalCreated,
  updateProposalStatus,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { ProposalStatus } from "@/lib/constants";

export function COMPGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.COMP;

  ponder.on("COMPGovernor:VoteCast", async ({ event, context }) => {
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

  ponder.on("COMPGovernor:ProposalCreated", async ({ event, context }) => {
    await proposalCreated(context, daoId, blockTime, {
      proposalId: event.args.proposalId.toString(),
      proposer: event.args.proposer,
      txHash: event.transaction.hash,
      targets: [...event.args.targets],
      values: [...event.args.values],
      signatures: [...event.args.signatures],
      calldatas: [...event.args.calldatas],
      startBlock: event.args.voteStart.toString(),
      endBlock: event.args.voteEnd.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on("COMPGovernor:ProposalCanceled", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on("COMPGovernor:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on("COMPGovernor:ProposalQueued", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.QUEUED,
    );
  });
}
