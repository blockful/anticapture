import { ponder } from "@/generated";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "../lib/event-handlers";

const daoId = "UNI";

ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
  await delegateChanged(event, context, daoId);
});

ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
  await delegatedVotesChanged(event, context, daoId);
});

ponder.on("UNIToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId);
});
