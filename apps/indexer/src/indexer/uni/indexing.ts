import { ponder } from "ponder:registry";
import {
  delegateChanged,
  delegatedVotesChanged,
  proposalCanceled,
  proposalCreated,
  proposalExecuted,
  tokenTransfer,
  voteCast,
} from "@/lib/event-handlers";
import viemClient from "@/lib/viemClient";
import { dao, daoToken, token } from "ponder:schema";
import { DaoIdEnum } from "@/lib/enums";

const daoId = DaoIdEnum.UNI;

ponder.on("UNIToken:setup", async ({ context }) => {
  const votingPeriod = await viemClient.getVotingPeriod(DaoIdEnum.UNI);
  const quorum = await viemClient.getQuorum(DaoIdEnum.UNI);
  const votingDelay = await viemClient.getVotingDelay(DaoIdEnum.UNI);
  const timelockDelay = await viemClient.getTimelockDelay(DaoIdEnum.UNI);
  const proposalThreshold = await viemClient.getProposalThreshold(
    DaoIdEnum.UNI,
  );

  await context.db.insert(dao).values({
    id: daoId,
    votingPeriod,
    quorum,
    votingDelay,
    timelockDelay,
    proposalThreshold,
  });
  const decimals = await viemClient.getDecimals(DaoIdEnum.UNI);
  const uniTokenAddress = viemClient.daoConfigParams[daoId].tokenAddress;
  await context.db.insert(token).values({
    id: uniTokenAddress,
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
