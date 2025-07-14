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
  const daoId = DaoIdEnum.OP;

  ponder.on(`OPGovernor:setup`, async ({ context }) => {
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

  ponder.on("OPGovernor:VoteCast", async ({ event, context }) => {
    const e = event as any;
    await voteCast(context, daoId, {
      proposalId: e.args.proposalId.toString(),
      voter: e.args.voter,
      reason: e.args.reason,
      support: e.args.support,
      timestamp: e.block.timestamp,
      txHash: e.transaction.hash,
      votingPower: e.args.weight,
    });
  });

  ponder.on(`OPGovernor:ProposalCreated`, async ({ event, context }) => {
    const e = event as any;
    await proposalCreated(context, daoId, {
      proposalId: e.args.proposalId.toString(),
      proposer: e.args.proposer,
      targets: e.args.targets,
      values: e.args.values,
      signatures: e.args.signatures,
      calldatas: e.args.calldatas,
      startBlock: e.args.startBlock.toString(),
      endBlock: e.args.endBlock.toString(),
      description: e.args.description,
      timestamp: e.block.timestamp,
    });
  });

  ponder.on(`OPGovernor:ProposalCanceled`, async ({ event, context }) => {
    const e = event as any;
    await proposalCanceled(context, e.args.proposalId.toString());
  });

  ponder.on(`OPGovernor:ProposalExecuted`, async ({ event, context }) => {
    const e = event as any;
    await proposalExecuted(context, e.args.proposalId.toString());
  });

  ponder.on(`OPToken:DelegateChanged`, async ({ event, context }) => {
    const e = event as any;
    await delegateChanged(context, daoId, {
      delegator: e.args.delegator,
      toDelegate: e.args.toDelegate,
      tokenId: e.log.address,
      fromDelegate: e.args.fromDelegate,
      txHash: e.transaction.hash,
      timestamp: e.block.timestamp,
    });
  });

  ponder.on(`OPToken:DelegateVotesChanged`, async ({ event, context }) => {
    const e = event as any;
    await delegatedVotesChanged(context, daoId, {
      tokenId: e.log.address,
      delegate: e.args.delegate,
      txHash: e.transaction.hash,
      newBalance: e.args.newBalance,
      oldBalance: e.args.previousBalance,
      timestamp: e.block.timestamp,
    });
  });
}
