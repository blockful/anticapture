// import { ponder } from "ponder:registry";
// import {
//   delegateChanged,
//   delegatedVotesChanged,
//   proposalCanceled,
//   proposalCreated,
//   proposalExecuted,
//   tokenTransfer,
//   voteCast,
// } from "@/lib/event-handlers";
// import viemClient from "@/lib/viemClient";
// import { dao, daoToken, token } from "ponder:schema";
// import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
// import { Address } from "viem";
// import { CONTRACT_ADDRESSES } from "@/lib/constants";

// const daoId = DaoIdEnum.UNI;
// const network = NetworkEnum.MAINNET;
// const tokenAddress = CONTRACT_ADDRESSES[network][daoId].token;
// ponder.on("UNIToken:setup", async ({ context }) => {
//   const votingPeriod = await viemClient.getVotingPeriod(DaoIdEnum.UNI, network);
//   const quorum = await viemClient.getQuorum(daoId, network);
//   const votingDelay = await viemClient.getVotingDelay(daoId, network);
//   const timelockDelay = await viemClient.getTimelockDelay(daoId, network);
//   const proposalThreshold = await viemClient.getProposalThreshold(
//     daoId,
//     network
//   );

//   await context.db.insert(dao).values({
//     id: daoId,
//     votingPeriod,
//     quorum,
//     votingDelay,
//     timelockDelay,
//     proposalThreshold,
//   });
//   const decimals = await viemClient.getDecimals(daoId, network);
//   await context.db.insert(token).values({
//     id: tokenAddress,
//     name: daoId,
//     decimals,
//     totalSupply: BigInt(0),
//     delegatedSupply: BigInt(0),
//     cexSupply: BigInt(0),
//     dexSupply: BigInt(0),
//     lendingSupply: BigInt(0),
//     circulatingSupply: BigInt(0),
//     treasury: BigInt(0),
//   });
//   await context.db.insert(daoToken).values({
//     id: daoId + "-" + tokenAddress,
//     daoId,
//     tokenId: tokenAddress,
//   });
// });

// ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
//   await delegateChanged(event, context, daoId, network);
// });

// ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
//   await delegatedVotesChanged(event, context, daoId, network);
// });

// ponder.on("UNIToken:Transfer", async ({ event, context }) => {
//   await tokenTransfer(event, context, daoId, network);
// });

// ponder.on("UNIGovernor:VoteCast", async ({ event, context }) => {
//   await voteCast(event, context, daoId, network);
// });

// /**
//  * Handler for ProposalCreated event of UNIGovernor contract
//  * Creates a new ProposalsOnchain record and updates the proposer's proposal count
//  */
// ponder.on("UNIGovernor:ProposalCreated", async ({ event, context }) => {
//   await proposalCreated(event, context, daoId, network);
// });

// /**
//  * Handler for ProposalCanceled event of UNIGovernor contract
//  * Updates the status of a proposal to CANCELED
//  */
// ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
//   await proposalCanceled(event, context, daoId, network);
// });

// /**
//  * Handler for ProposalExecuted event of UNIGovernor contract
//  * Updates the status of a proposal to EXECUTED
//  */
// ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
//   await proposalExecuted(event, context, daoId, network);
// });
