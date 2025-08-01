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
    `OPGovernor:ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)`,
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
    `OPGovernor:ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description, uint8 proposalType)`,
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
    `OPGovernor:ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed votingModule, bytes proposalData, uint256 startBlock, uint256 endBlock, string description, uint8 proposalType)`,
    async ({ event, context }) => {
      await proposalCreated(context, daoId, {
        proposalId: event.args.proposalId.toString(),
        proposer: event.args.proposer,
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
        startBlock: event.args.startBlock.toString(),
        endBlock: event.args.endBlock.toString(),
        description: event.args.description,
        timestamp: event.block.timestamp,
      });
    },
  );

  ponder.on(
    `OPGovernor:ProposalCreated(uint256 proposalId, address proposer, address votingModule, bytes proposalData, uint256 startBlock, uint256 endBlock, string description)`,
    async ({ event, context }) => {
      await proposalCreated(context, daoId, {
        proposalId: event.args.proposalId.toString(),
        proposer: event.args.proposer,
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
        startBlock: event.args.startBlock.toString(),
        endBlock: event.args.endBlock.toString(),
        description: event.args.description,
        timestamp: event.block.timestamp,
      });
    },
  );

  ponder.on(`OPGovernor:ProposalCanceled`, async ({ event, context }) => {
    await proposalCanceled(context, event.args.proposalId.toString());
  });

  ponder.on(`OPGovernor:ProposalExecuted`, async ({ event, context }) => {
    await proposalExecuted(context, event.args.proposalId.toString());
  });
}
