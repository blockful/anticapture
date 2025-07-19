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
    const [
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    ] = await Promise.all([
      governor.getVotingPeriod(),
      governor.getQuorum(),
      governor.getVotingDelay(),
      governor.getTimelockDelay(),
      governor.getProposalThreshold(),
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

  ponder.on("UNIGovernor:VoteCast", async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      reason: event.args.reason,
      support: event.args.support,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: event.args.votes,
    });
  });

  ponder.on("UNIGovernor:ProposalCreated", async ({ event, context }) => {
    await proposalCreated(context, daoId, {
      proposalId: event.args.id.toString(),
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

  ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
    await proposalCanceled(context, event.args.id.toString());
  });

  ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
    await proposalExecuted(context, event.args.id.toString());
  });

  ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
    await delegateChanged(context, daoId, {
      delegator: event.args.delegator,
      toDelegate: event.args.toDelegate,
      tokenId: event.log.address,
      fromDelegate: event.args.fromDelegate,
      txHash: event.transaction.hash,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
    await delegatedVotesChanged(context, daoId, {
      tokenId: event.log.address,
      delegate: event.args.delegate,
      txHash: event.transaction.hash,
      newBalance: event.args.newBalance,
      oldBalance: event.args.previousBalance,
      timestamp: event.block.timestamp,
    });
  });
}
