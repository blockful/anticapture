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
import viemClient from "../lib/viemClient";

const daoId = "UNI";

ponder.on("UNIToken:setup", async ({ context }) => {
  const { DAO, Token, DAOToken } = context.db;

  const votingPeriod = await viemClient.getVotingPeriod();
  const quorum = await viemClient.getQuorum();
  const votingDelay = await viemClient.getVotingDelay();
  const timelockDelay = await viemClient.getTimelockDelay();
  const proposalThreshold = await viemClient.getProposalThreshold();

  await DAO.create({
    id: daoId,
    data: {
      votingPeriod,
      quorum,
      votingDelay,
      timelockDelay,
      proposalThreshold,
    },
  });
  const totalSupply = await viemClient.getTotalSupply();
  const decimals = await viemClient.getDecimals();
  const uniTokenAddress = viemClient.daoConfigParams[daoId].tokenAddress;
  await Token.create({
    id: uniTokenAddress,
    data: {
      name: daoId,
      decimals,
      totalSupply,
    },
  });
  await DAOToken.create({
    id: daoId + "-" + uniTokenAddress,
    data: {
      daoId,
      tokenId: uniTokenAddress,
    },
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
