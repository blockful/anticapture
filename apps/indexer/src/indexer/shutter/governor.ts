import { ponder } from "ponder:registry";

import { upsertProposal, voteCast } from "@/eventHandlers";
import { DaoIdEnum } from "@/lib/enums";
import { Governor } from "@/interfaces/governor";
import { dao } from "ponder:schema";

export function SHUGovernanceIndexer(governor: Governor) {
  const daoId = DaoIdEnum.SHU;

  ponder.on(`Azorius:setup`, async ({ context }) => {
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

  ponder.on(`LinearVotingStrategy:Voted`, async ({ event, context }) => {
    await voteCast(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      reason: "",
      support: event.args.voteType,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: event.args.weight,
    });
  });

  ponder.on(
    `LinearVotingStrategy:ProposalInitialized`,
    async ({ event, context }) => {
      await upsertProposal(context, daoId, {
        proposalId: event.args.proposalId.toString(),
        endBlock: event.args.votingEndBlock.toString(),
        status: "ACTIVE",
      });
    },
  );

  ponder.on(`Azorius:ProposalCreated`, async ({ event, context }) => {
    const targets: `0x${string}`[] = [];
    const values: bigint[] = [];
    const calldatas: `0x${string}`[] = [];

    event.args.transactions.forEach((transaction) => {
      targets.push(transaction.to);
      values.push(transaction.value);
      calldatas.push(transaction.data);
    });

    await upsertProposal(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      proposerAccountId: event.args.proposer,
      targets,
      values,
      signatures: [],
      calldatas,
      startBlock: event.block.number.toString(),
      description: event.args.metadata,
      timestamp: event.block.timestamp,
    });
  });

  ponder.on(`Azorius:ProposalExecuted`, async ({ event, context }) => {
    await upsertProposal(context, daoId, {
      proposalId: event.args.proposalId.toString(),
      status: "EXECUTED",
    });
  });
}
