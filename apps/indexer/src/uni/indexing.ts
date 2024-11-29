import { ponder } from "@/generated";
import {
  delegateChanged,
  delegatedVotesChanged,
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  tokenTransfer,
  voteCast,
} from "../lib/event-handlers";
import onchainClient from "../lib/onchainClient";
import { DAO, DAOToken, Token } from "../../ponder.schema";

const daoId = "UNI";

ponder.on("UNIToken:setup", async ({ context }) => {
  const votingPeriod = await onchainClient(context).getVotingPeriod();
  const quorum = await onchainClient(context).getQuorum();
  const votingDelay = await onchainClient(context).getVotingDelay();
  const timelockDelay = await onchainClient(context).getTimelockDelay();
  const proposalThreshold = await onchainClient(context).getProposalThreshold();
  
  await context.db.insert(DAO).values({
    id: daoId,
    votingPeriod,
    quorum,
    votingDelay,
    timelockDelay,
    proposalThreshold,
  });
  const totalSupply = await onchainClient(context).getTotalSupply();
  const decimals = await onchainClient(context).getDecimals();
  const uniTokenAddress =
    onchainClient(context).daoConfigParams[daoId].tokenAddress;
  await context.db.insert(Token).values({
    id: uniTokenAddress,
    name: daoId,
    decimals,
    totalSupply,
  });
  await context.db.insert(DAOToken).values({
    id: daoId + "-" + uniTokenAddress,
    daoId,
    tokenId: uniTokenAddress,
  });
});

ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
  await delegateChanged(event, context, daoId);
});

ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
  await delegatedVotesChanged(event, context, daoId);
});

ponder.on("UNIToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId);
});

ponder.on("UNIGovernor:VoteCast", async ({ event, context }) => {
  await voteCast(event, context, daoId);
});

/**
 * Handler for ProposalCreated event of UNIGovernor contract
 * Creates a new ProposalsOnchain record and updates the proposer's proposal count
 */
ponder.on("UNIGovernor:ProposalCreated", async ({ event, context }) => {
  await proposalCreated(event, context, daoId);
});

/**
 * Handler for ProposalCanceled event of UNIGovernor contract
 * Updates the status of a proposal to CANCELED
 */
ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
  await proposalCanceled(event, context, daoId);
});

/**
 * Handler for ProposalExecuted event of UNIGovernor contract
 * Updates the status of a proposal to EXECUTED
 */
ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
  await proposalExecuted(event, context, daoId);
});
