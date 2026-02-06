import { Account, Chain, Client, fromHex, toHex, Transport } from "viem";

import { ProposalStatus } from "../lib/constants";

/**
 * Base implementation for EVM Compound-based governance contracts.
 * Provides common functionality for proposal status calculation
 * not handled by the indexing process.
 */

export abstract class GovernorBase<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> {
  protected cache: {
    quorum?: bigint;
    proposalThreshold?: bigint;
    votingDelay?: bigint;
    votingPeriod?: bigint;
    timelockDelay?: bigint;
  } = {};

  constructor(protected client: Client<TTransport, TChain, TAccount>) {}

  abstract calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint;

  abstract getQuorum(proposalId: string | null): Promise<bigint>;

  async getProposalStatus(proposal: {
    id: string;
    status: string;
    startBlock: number;
    endBlock: number;
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): Promise<string> {
    const currentBlock = await this.getCurrentBlockNumber();

    // Skip proposals already finalized via event
    if (
      [
        ProposalStatus.CANCELED,
        ProposalStatus.QUEUED,
        ProposalStatus.EXECUTED,
      ].includes(proposal.status as ProposalStatus)
    ) {
      return proposal.status;
    }

    if (currentBlock < proposal.startBlock) {
      return ProposalStatus.PENDING;
    }

    if (
      currentBlock >= proposal.startBlock &&
      currentBlock < proposal.endBlock
    ) {
      return ProposalStatus.ACTIVE;
    }

    // After voting period ends
    if (currentBlock >= proposal.endBlock) {
      const proposalQuorum = this.calculateQuorum({
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
      });

      const quorum = await this.getQuorum(proposal.id);
      const hasQuorum = proposalQuorum >= quorum;
      if (!hasQuorum) return ProposalStatus.NO_QUORUM;

      const voteSum =
        proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

      const hasMajority = proposal.forVotes > proposal.againstVotes;
      if (voteSum > quorum && !hasMajority) return ProposalStatus.DEFEATED;

      return ProposalStatus.SUCCEEDED;
    }

    return proposal.status;
  }

  async getCurrentBlockNumber(): Promise<number> {
    const result = await this.client.request({
      method: "eth_blockNumber",
    });
    return fromHex(result, "number");
  }

  async getBlockTime(blockNumber: number): Promise<number | null> {
    const block = await this.client.request({
      method: "eth_getBlockByNumber",
      params: [toHex(blockNumber), false],
    });
    return block?.timestamp ? fromHex(block.timestamp, "number") : null;
  }
}
