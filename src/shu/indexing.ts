// import { ponder } from "@/generated";
// import {
//   delegateChanged,
//   delegatedVotesChanged,
//   tokenTransfer,
// } from "../lib/event-handlers";

// const daoId = "SHU";

// ponder.on("SHUToken:setup", async ({ context }) => {
//   const { DAO } = context.db;
//   await DAO.create({
//     id: daoId,
//   });
// });

// ponder.on("SHUToken:DelegateChanged", async ({ event, context }) => {
//   await delegateChanged(event, context, daoId);
// });

// ponder.on("SHUToken:DelegateVotesChanged", async ({ event, context }) => {
//   await delegatedVotesChanged(event, context, daoId);
// });

// ponder.on("SHUToken:Transfer", async ({ event, context }) => {
//   await tokenTransfer(event, context, daoId);
// });
