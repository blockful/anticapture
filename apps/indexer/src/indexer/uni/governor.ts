import { ponder } from "ponder:registry";
import { dao } from "ponder:schema";

import {
  proposalCreated,
  updateProposalStatus,
  voteCast,
} from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { DAOClient } from "@/interfaces/client";
import { ProposalStatus } from "@/lib/constants";
import { env } from "@/env";

export function GovernorIndexer(client: DAOClient, blockTime: number) {
  const daoId = DaoIdEnum.UNI;

  ponder.on("UNIGovernor:setup", async ({ context }) => {
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
      chainId: env.CHAIN_ID,
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
    await proposalCreated(context, daoId, blockTime, {
      proposalId: event.args.id.toString(),
      proposer: event.args.proposer,
      txHash: event.transaction.hash,
      targets: event.args.targets ? [...event.args.targets] : [],
      values: event.args.values ? [...event.args.values] : [],
      signatures: event.args.signatures ? [...event.args.signatures] : [],
      calldatas: event.args.calldatas ? [...event.args.calldatas] : [],
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.CANCELED,
    );
  });

  ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.EXECUTED,
    );
  });

  ponder.on("UNIGovernor:ProposalQueued", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.id.toString(),
      ProposalStatus.QUEUED,
    );
  });
}
