import { ponder } from "ponder:registry";

import {
  proposalCreated,
  updateProposalStatus,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { ProposalStatus } from "@/lib/constants";

export function GovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.ARB;

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

  ponder.on(`ARBGovernor:ProposalCanceled`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on(`ARBGovernor:ProposalExecuted`, async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
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
      await proposalCreated(context, daoId, blockTime, {
        txHash: event.transaction.hash,
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
      await updateProposalStatus(
        context,
        event.args.proposalId.toString(),
        ProposalStatus.CANCELED,
      );
    },
  );

  ponder.on(
    `ARBGovernorTreasury:ProposalExecuted`,
    async ({ event, context }) => {
      await updateProposalStatus(
        context,
        event.args.proposalId.toString(),
        ProposalStatus.EXECUTED,
      );
    },
  );
}
