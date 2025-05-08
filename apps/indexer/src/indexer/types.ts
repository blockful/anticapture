import { Event } from "ponder:registry";

export type DaoVoteCastEvent =
  | Event<"ENSGovernor:VoteCast">
  | Event<"UNIGovernor:VoteCast">;

export type DaoDelegateChangedEvent =
  | Event<"ENSToken:DelegateChanged">
  | Event<"UNIToken:DelegateChanged">;

export type DaoDelegateVotesChangedEvent =
  | Event<"ENSToken:DelegateVotesChanged">
  | Event<"UNIToken:DelegateVotesChanged">;

export type DaoTransferEvent =
  | Event<"ENSToken:Transfer">
  | Event<"UNIToken:Transfer">
  | Event<"ARBToken:Transfer">;

export type DaoProposalCreatedEvent =
  | Event<"ENSGovernor:ProposalCreated">
  | Event<"UNIGovernor:ProposalCreated">;

export type DaoProposalCanceledEvent =
  | Event<"ENSGovernor:ProposalCanceled">
  | Event<"UNIGovernor:ProposalCanceled">;

export type DaoProposalExecutedEvent =
  | Event<"ENSGovernor:ProposalExecuted">
  | Event<"UNIGovernor:ProposalExecuted">;
