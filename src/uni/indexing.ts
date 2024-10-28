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

const daoId = "UNI";

ponder.on("UNIToken:setup", async ({ context }) => {
  const { DAO } = context.db;
  await DAO.create({
    id: daoId,
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
