// /**
//  * @file index.ts
//  * @description This file contains Ponder event handlers for COMP (Ethereum Name Service) related smart contracts.
//  * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
//  *
//  */

// import { ponder } from "@/generated";
// import {
//   delegateChanged,
//   delegatedVotesChanged,
//   tokenTransfer,
// } from "../lib/event-handlers";

// const daoId = "COMP";

// ponder.on("COMPToken:setup", async ({ context }) => {
//   const { DAO } = context.db;
//   await DAO.create({
//     id: daoId,
//   });
// });

// ponder.on("COMPToken:DelegateChanged", async ({ event, context }) => {
//   await delegateChanged(event, context, daoId);
// });

// ponder.on("COMPToken:DelegateVotesChanged", async ({ event, context }) => {
//   await delegatedVotesChanged(event, context, daoId);
// });

// /**
//  * Handler for Transfer event of COMPToken contract
//  * Creates a new Transfer record and updates Account balances
//  */
// ponder.on("COMPToken:Transfer", async ({ event, context }) => {
//   await tokenTransfer(event, context, daoId);
// });
