/**
 * @file indexing.ts
 * @description This file contains Ponder event handlers for UNI (Uniswap) related smart contracts.
 * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
 */
import { ponder } from "ponder:registry";
import { dao, daoToken, token } from "ponder:schema";
import {
  delegateChanged,
  delegatedVotesChanged,
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  tokenTransfer,
  voteCast,
} from "@/lib/event-handlers";
import { UNITokenAbi } from "./abi";
import { Governor } from "@/lib/governor";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { Address } from "viem";

export class UNIIndexer {
  private governor: Governor;
  private daoId: DaoIdEnum = DaoIdEnum.UNI;
  private network: NetworkEnum = NetworkEnum.ETHEREUM;
  private tokenAddress: Address;

  constructor(governor: Governor, tokenAddress: Address) {
    this.governor = governor;
    this.tokenAddress = tokenAddress;

    ponder.on("UNIToken:setup", async ({ context }) => {
      const votingPeriod = await this.governor.getVotingPeriod();
      const quorum = await this.governor.getQuorum();
      const votingDelay = await this.governor.getVotingDelay();
      const timelockDelay = await this.governor.getTimelockDelay();
      const proposalThreshold = await this.governor.getProposalThreshold();

      await context.db.insert(dao).values({
        id: this.daoId,
        votingPeriod,
        quorum,
        votingDelay,
        timelockDelay,
        proposalThreshold,
      });

      const decimals = await context.client.readContract({
        abi: UNITokenAbi,
        address: this.tokenAddress,
        functionName: "decimals",
      });

      await context.db.insert(token).values({
        id: this.tokenAddress,
        name: this.daoId,
        decimals,
        totalSupply: BigInt(0),
        delegatedSupply: BigInt(0),
        cexSupply: BigInt(0),
        dexSupply: BigInt(0),
        lendingSupply: BigInt(0),
        circulatingSupply: BigInt(0),
        treasury: BigInt(0),
      });

      await context.db.insert(daoToken).values({
        id: this.daoId + "-" + this.tokenAddress,
        daoId: this.daoId,
        tokenId: this.tokenAddress,
      });
    });

    ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
      await delegateChanged(event, context, this.daoId, this.network);
    });

    ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
      await delegatedVotesChanged(event, context, this.daoId, this.network);
    });

    /**
     * Handler for Transfer event of UNIToken contract
     * Creates a new Transfer record and updates Account balances
     */
    ponder.on("UNIToken:Transfer", async ({ event, context }) => {
      await tokenTransfer(event, context, this.daoId, this.network);
    });

    /**
     * Handler for VoteCast event of UNIGovernor contract
     * Creates a new VotesOnchain record and updates the voter's vote count
     */
    ponder.on("UNIGovernor:VoteCast", async ({ event, context }) => {
      await voteCast(event, context, this.daoId);
    });

    /**
     * Handler for ProposalCreated event of UNIGovernor contract
     * Creates a new ProposalsOnchain record and updates the proposer's proposal count
     */
    ponder.on("UNIGovernor:ProposalCreated", async ({ event, context }) => {
      await proposalCreated(event, context, this.daoId, this.network);
    });

    /**
     * Handler for ProposalCanceled event of UNIGovernor contract
     * Updates the status of a proposal to CANCELED
     */
    ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
      await proposalCanceled(event, context, this.daoId, this.network);
    });

    /**
     * Handler for ProposalExecuted event of UNIGovernor contract
     * Updates the status of a proposal to EXECUTED
     */
    ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
      await proposalExecuted(event, context, this.daoId, this.network);
    });
  }
}
