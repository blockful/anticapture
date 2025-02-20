/**
 * @file index.ts
 * @description This file contains Ponder event handlers for ENS (Ethereum Name Service) related smart contracts.
 * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
 *
 */

import { ponder } from "ponder:registry";
import {
  delegateChanged,
  delegatedVotesChanged,
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  tokenTransfer,
  voteCast,
} from "../../lib/event-handlers";
import viemClient from "@/lib/viemClient";
import { DaoIdEnum } from "@/lib/enums";
import { dao, daoToken, token } from "ponder:schema";
import { CONTRACT_ADDRESS_MAINNET } from "@/lib/constants";

const daoId = DaoIdEnum.ENS;

ponder.on("ENSToken:setup", async ({ context }) => {
  const votingPeriod = await viemClient.getVotingPeriod(daoId);
  const quorum = await viemClient.getQuorum(daoId);
  const votingDelay = await viemClient.getVotingDelay(daoId);
  const timelockDelay = await viemClient.getTimelockDelay(daoId);
  const proposalThreshold = await viemClient.getProposalThreshold(daoId);

  await context.db.insert(dao).values({
    id: daoId,
    votingPeriod,
    quorum,
    votingDelay,
    timelockDelay,
    proposalThreshold,
  });
  const decimals = await viemClient.getDecimals(daoId);
  const tokenAddress = CONTRACT_ADDRESS_MAINNET[daoId].token;
  await context.db.insert(token).values({
    id: tokenAddress,
    name: daoId,
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
    id: daoId + "-" + tokenAddress,
    daoId,
    tokenId: tokenAddress,
  });
});

ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
  await delegateChanged(event, context, daoId);
});

ponder.on("ENSToken:DelegateVotesChanged", async ({ event, context }) => {
  await delegatedVotesChanged(event, context, daoId);
});

/**
 * Handler for Transfer event of ENSToken contract
 * Creates a new Transfer record and updates Account balances
 */
ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId);
});

/**
 * Handler for VoteCast event of ENSGovernor contract
 * Creates a new VotesOnchain record and updates the voter's vote count
 */
ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
  await voteCast(event, context, daoId);
});

/**
 * Handler for ProposalCreated event of ENSGovernor contract
 * Creates a new ProposalsOnchain record and updates the proposer's proposal count
 */
ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  await proposalCreated(event, context, daoId);
});

/**
 * Handler for ProposalCanceled event of ENSGovernor contract
 * Updates the status of a proposal to CANCELED
 */
ponder.on("ENSGovernor:ProposalCanceled", async ({ event, context }) => {
  await proposalCanceled(event, context, daoId);
});

/**
 * Handler for ProposalExecuted event of ENSGovernor contract
 * Updates the status of a proposal to EXECUTED
 */
ponder.on("ENSGovernor:ProposalExecuted", async ({ event, context }) => {
  await proposalExecuted(event, context, daoId);
});
