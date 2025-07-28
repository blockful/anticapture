import { ponder } from "ponder:registry";

import {
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";

export function GovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.ENS;

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
    await proposalCanceled(context, event.args.proposalId.toString());
  });

  ponder.on(`ENSGovernor:ProposalExecuted`, async ({ event, context }) => {
    await proposalExecuted(context, event.args.proposalId.toString());
  });
}
