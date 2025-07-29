import { ponder } from "ponder:registry";

import {
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { Governor } from "@/interfaces/governor";
import { dao } from "ponder:schema";

export function GovernorIndexer(governor: Governor) {
  const daoId = DaoIdEnum.ARB;

  ponder.on(`ARBGovernor:setup`, async ({ context }) => {
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

  ponder.on(`ARBGovernor:VoteCast`, async ({ event, context }) => {
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

  ponder.on(`ARBGovernor:ProposalCreated`, async ({ event, context }) => {
    await proposalCreated(context, daoId, {
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

  ponder.on(`ARBGovernor:ProposalCanceled`, async ({ event, context }) => {
    await proposalCanceled(context, event.args.proposalId.toString());
  });

  ponder.on(`ARBGovernor:ProposalExecuted`, async ({ event, context }) => {
    await proposalExecuted(context, event.args.proposalId.toString());
  });

  ///////////////////////
  // Treasury
  ///////////////////////

  ponder.on(`ARBGovernorTreasury:VoteCast`, async ({ event, context }) => {
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

  ponder.on(
    `ARBGovernorTreasury:ProposalCreated`,
    async ({ event, context }) => {
      await proposalCreated(context, daoId, {
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
    },
  );

  ponder.on(
    `ARBGovernorTreasury:ProposalCanceled`,
    async ({ event, context }) => {
      await proposalCanceled(context, event.args.proposalId.toString());
    },
  );

  ponder.on(
    `ARBGovernorTreasury:ProposalExecuted`,
    async ({ event, context }) => {
      await proposalExecuted(context, event.args.proposalId.toString());
    },
  );
}
