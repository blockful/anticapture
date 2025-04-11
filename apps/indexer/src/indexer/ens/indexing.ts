/**
 * @file index.ts
 * @description This file contains Ponder event handlers for ENS (Ethereum Name Service) related smart contracts.
 * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
 *
 */

import { ponder } from "ponder:registry";
import { dao, daoToken, token } from "ponder:schema";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import {
  delegateChanged,
  delegatedVotesChanged,
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  tokenTransfer,
  voteCast,
} from "@/lib/event-handlers";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ENSGovernorAbi, ENSTokenAbi } from "./abi";
import { newGovernorClient } from "@/lib/governorClient";
import { readContract } from "viem/actions";

const daoId = DaoIdEnum.ENS;
const network = NetworkEnum.ETHEREUM;
const tokenAddress = CONTRACT_ADDRESSES[network][daoId]!.token;

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});
const governorClient = newGovernorClient(client, ENSGovernorAbi, tokenAddress);

ponder.on("ENSToken:setup", async ({ context }) => {
  const votingPeriod = await governorClient.getVotingPeriod();
  const quorum = await governorClient.getQuorum(daoId);
  const votingDelay = await governorClient.getVotingDelay();
  const timelockDelay = await governorClient.getTimelockDelay(daoId);
  const proposalThreshold = await governorClient.getProposalThreshold();

  await context.db.insert(dao).values({
    id: daoId,
    votingPeriod,
    quorum,
    votingDelay,
    timelockDelay,
    proposalThreshold,
  });
  const decimals = await readContract(client, {
    abi: ENSTokenAbi,
    address: tokenAddress,
    functionName: "decimals",
  });
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
  await delegateChanged(event, context, daoId, network);
});

ponder.on("ENSToken:DelegateVotesChanged", async ({ event, context }) => {
  await delegatedVotesChanged(event, context, daoId, network);
});

/**
 * Handler for Transfer event of ENSToken contract
 * Creates a new Transfer record and updates Account balances
 */
ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId, network);
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
  await proposalCreated(event, context, daoId, network);
});

/**
 * Handler for ProposalCanceled event of ENSGovernor contract
 * Updates the status of a proposal to CANCELED
 */
ponder.on("ENSGovernor:ProposalCanceled", async ({ event, context }) => {
  await proposalCanceled(event, context, daoId, network);
});

/**
 * Handler for ProposalExecuted event of ENSGovernor contract
 * Updates the status of a proposal to EXECUTED
 */
ponder.on("ENSGovernor:ProposalExecuted", async ({ event, context }) => {
  await proposalExecuted(event, context, daoId, network);
});
