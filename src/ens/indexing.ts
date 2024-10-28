// /**
//  * @file index.ts
//  * @description This file contains Ponder event handlers for ENS (Ethereum Name Service) related smart contracts.
//  * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
//  *
//  */

// import { ponder } from "@/generated";
// import {
//   delegateChanged,
//   delegatedVotesChanged,
//   proposalCanceled,
//   proposalCreated,
//   proposalExecuted,
//   tokenTransfer,
//   voteCast,
// } from "../lib/event-handlers";

// const daoId = "ENS";

// ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
//   await delegateChanged(event, context, daoId);
// });

// ponder.on("ENSToken:DelegateVotesChanged", async ({ event, context }) => {
//   await delegatedVotesChanged(event, context, daoId);
// });

// /**
//  * Handler for Transfer event of ENSToken contract
//  * Creates a new Transfer record and updates Account balances
//  */
// ponder.on("ENSToken:Transfer", async ({ event, context }) => {
//   await tokenTransfer(event, context, daoId);
// });

// /**
//  * Handler for VoteCast event of ENSGovernor contract
//  * Creates a new VotesOnchain record and updates the voter's vote count
//  */
// ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
//   await voteCast(event, context, daoId);
// });

// /**
//  * Handler for ProposalCreated event of ENSGovernor contract
//  * Creates a new ProposalsOnchain record and updates the proposer's proposal count
//  */
// ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
//   await proposalCreated(event, context, daoId);
// });

// /**
//  * Handler for ProposalCanceled event of ENSGovernor contract
//  * Updates the status of a proposal to CANCELED
//  */
// ponder.on("ENSGovernor:ProposalCanceled", async ({ event, context }) => {
//   await proposalCanceled(event, context, daoId);
// });

// /**
//  * Handler for ProposalExecuted event of ENSGovernor contract
//  * Updates the status of a proposal to EXECUTED
//  */
// ponder.on("ENSGovernor:ProposalExecuted", async ({ event, context }) => {
//   await proposalExecuted(event, context, daoId);
// });
