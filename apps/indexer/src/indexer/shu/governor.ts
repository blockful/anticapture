import { ponder } from "ponder:registry";
import { accountPower, feedEvent, proposalsOnchain } from "ponder:schema";
import { getAddress, type Hex } from "viem";

import { updateProposalStatus, voteCast } from "@/eventHandlers";
import { ensureAccountExists } from "@/eventHandlers/shared";
import { ProposalStatus } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

/**
 * Custom governance indexer for Shutter DAO's Fractal/Azorius framework.
 *
 * Normalizes Azorius ProposalCreated and LinearERC20Voting Voted events
 * into the existing proposalsOnchain/votesOnchain schema.
 *
 * Vote types: NO(0)→against, YES(1)→for, ABSTAIN(2)→abstain (same mapping)
 */
export function SHUGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.SHU;

  ponder.on("Azorius:ProposalCreated", async ({ event, context }) => {
    const { proposalId, proposer, transactions, metadata } = event.args;
    const proposalIdStr = proposalId.toString();

    await ensureAccountExists(context, proposer);

    // Normalize Azorius Transaction[] to existing schema format
    const targets = transactions.map((tx) => getAddress(tx.to));
    const values = transactions.map((tx) => tx.value);
    const calldatas = transactions.map((tx) => tx.data) as Hex[];

    // Metadata is a JSON string with "title" and "description" keys
    let title: string | null = null;
    let description = metadata;
    try {
      const parsed = JSON.parse(metadata) as {
        title?: string;
        description?: string;
      };
      title = parsed.title || null;
      description = parsed.description || metadata;
    } catch {
      // Fallback: treat raw metadata as description, extract title from first line
      title = metadata.split("\n")[0]?.replace(/^#+\s*/, "") || null;
    }

    // Insert proposal — endBlock will be updated by ProposalInitialized
    await context.db.insert(proposalsOnchain).values({
      id: proposalIdStr,
      txHash: event.transaction.hash,
      daoId,
      proposerAccountId: getAddress(proposer),
      targets,
      values,
      signatures: [],
      calldatas,
      startBlock: Number(event.block.number),
      endBlock: 0,
      title,
      description,
      timestamp: event.block.timestamp,
      status: ProposalStatus.PENDING,
      endTimestamp: 0n,
    });

    const { votingPower: proposerVotingPower } = await context.db
      .insert(accountPower)
      .values({
        accountId: getAddress(proposer),
        daoId,
        proposalsCount: 1,
      })
      .onConflictDoUpdate((current) => ({
        proposalsCount: current.proposalsCount + 1,
      }));

    // TODO: "PROPOSAL" is hardcoded — should use an enum from eventTypeEnum (ponder:schema) once available
    await context.db.insert(feedEvent).values({
      txHash: event.transaction.hash,
      logIndex: event.log.logIndex,
      type: "PROPOSAL",
      timestamp: event.block.timestamp,
      metadata: {
        id: proposalIdStr,
        proposer: getAddress(proposer),
        votingPower: proposerVotingPower,
        title,
      },
    });
  });

  /**
   * LinearVotingStrategy ProposalInitialized event.
   * Updates the proposal's endBlock and endTimestamp.
   * Fired in the same transaction as ProposalCreated.
   */
  ponder.on(
    "LinearVotingStrategy:ProposalInitialized",
    async ({ event, context }) => {
      const { proposalId, votingEndBlock } = event.args;
      const proposalIdStr = proposalId.toString();

      const proposal = await context.db.find(proposalsOnchain, {
        id: proposalIdStr,
      });

      if (!proposal) return;

      const blockDelta = votingEndBlock - Number(event.block.number);
      const endTimestamp =
        event.block.timestamp + BigInt(blockDelta * blockTime);

      await context.db.update(proposalsOnchain, { id: proposalIdStr }).set({
        endBlock: votingEndBlock,
        endTimestamp,
        status: ProposalStatus.ACTIVE,
      });
    },
  );

  /**
   * LinearVotingStrategy Voted event.
   * Vote types align: NO(0)→against, YES(1)→for, ABSTAIN(2)→abstain.
   */
  ponder.on("LinearVotingStrategy:Voted", async ({ event, context }) => {
    const { voter, proposalId, voteType, weight } = event.args;

    await voteCast(context, daoId, {
      proposalId: proposalId.toString(),
      voter,
      reason: "",
      support: voteType,
      timestamp: event.block.timestamp,
      txHash: event.transaction.hash,
      votingPower: weight,
      logIndex: event.log.logIndex,
    });
  });

  ponder.on("Azorius:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });
}
