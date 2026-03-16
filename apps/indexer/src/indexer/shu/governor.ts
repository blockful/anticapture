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
 * Key differences from OZ Governor:
 * - Proposals created via Azorius with Transaction[] instead of targets/values/calldatas
 * - Voting happens on LinearERC20Voting strategy contract, not the governor
 * - Vote types: NO(0)→against, YES(1)→for, ABSTAIN(2)→abstain (same mapping)
 * - ProposalInitialized provides the voting end block (same tx as ProposalCreated)
 */
export function ShutterGovernorIndexer(blockTime: number) {
  const daoId = DaoIdEnum.SHU;

  /**
   * Azorius ProposalCreated event.
   * Normalizes Transaction[] tuple into targets/values/calldatas arrays.
   * Sets startBlock to current block; endBlock is updated by ProposalInitialized.
   */
  ponder.on("ShutterAzorius:ProposalCreated", async ({ event, context }) => {
    const { proposalId, proposer, transactions, metadata } = event.args;
    const proposalIdStr = proposalId.toString();

    await ensureAccountExists(context, proposer);

    // Normalize Azorius Transaction[] to existing schema format
    const targets = transactions.map((tx) => getAddress(tx.to));
    const values = transactions.map((tx) => tx.value);
    const calldatas = transactions.map((tx) => tx.data) as Hex[];

    const title =
      metadata.split("\n")[0]?.replace(/^#+\s*/, "") ||
      `Proposal ${proposalIdStr}`;

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
      description: metadata,
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
   * LinearERC20Voting ProposalInitialized event.
   * Updates the proposal's endBlock and endTimestamp.
   * Fired in the same transaction as ProposalCreated.
   */
  ponder.on(
    "ShutterLinearVoting:ProposalInitialized",
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
   * LinearERC20Voting Voted event.
   * Vote types align: NO(0)→against, YES(1)→for, ABSTAIN(2)→abstain.
   */
  ponder.on("ShutterLinearVoting:Voted", async ({ event, context }) => {
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

  /**
   * Azorius ProposalExecuted event.
   * Updates proposal status to EXECUTED.
   */
  ponder.on("ShutterAzorius:ProposalExecuted", async ({ event, context }) => {
    await updateProposalStatus(
      context,
      event.args.proposalId.toString(),
      ProposalStatus.EXECUTED,
    );
  });
}
