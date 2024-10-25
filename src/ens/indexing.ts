/**
 * @file index.ts
 * @description This file contains Ponder event handlers for ENS (Ethereum Name Service) related smart contracts.
 * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
 *
 */

import { ponder } from "@/generated";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
  voteCast,
} from "../lib/event-handlers";

const daoId = "ENS";

ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
  await delegateChanged(event, context, daoId);
});

ponder.on("ENSToken:DelegateVotesChanged", async ({ event, context }) => {
  await delegatedVotesChanged(event, context, daoId);
});

/**
 * Handler for Transfer event of ENSToken contract
 * Creates a new Transfer record and updates Account balances
 */
ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId);
});

/**
 * Handler for VoteCast event of ENSGovernor contract
 * Creates a new VotesOnchain record and updates the voter's vote count
 */
ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
  await voteCast(event, context, daoId);
});

/**
 * Handler for ProposalCreated event of ENSGovernor contract
 * Creates a new ProposalsOnchain record and updates the proposer's proposal count
 */
ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  const { ProposalsOnchain, Account, AccountPower } = context.db;

  await Account.upsert({
    id: event.args.proposer,
  });

  // Create proposal record
  await ProposalsOnchain.create({
    id: event.args.proposalId.toString(),
    data: {
      dao: daoId,
      proposer: event.args.proposer,
      targets: JSON.stringify(event.args.targets),
      values: JSON.stringify(event.args.values.map((v) => v.toString())),
      signatures: JSON.stringify(event.args.signatures),
      calldatas: JSON.stringify(event.args.calldatas),
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
      status: "Pending",
      forVotes: BigInt(0),
      againstVotes: BigInt(0),
      abstainVotes: BigInt(0),
    },
  });

  await AccountPower.upsert({
    id: event.args.proposer,
    create: {
      dao: daoId,
      account: event.args.proposer,
      proposalsCount: 1,
    },
    update: ({ current }) => ({
      proposalsCount: (current.proposalsCount ?? 0) + 1,
    }),
  });
});

/**
 * Handler for ProposalCanceled event of ENSGovernor contract
 * Updates the status of a proposal to CANCELED
 */
ponder.on("ENSGovernor:ProposalCanceled", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.update({
    id: event.args.proposalId.toString(),
    data: { status: "CANCELED" },
  });
});

/**
 * Handler for ProposalExecuted event of ENSGovernor contract
 * Updates the status of a proposal to EXECUTED
 */
ponder.on("ENSGovernor:ProposalExecuted", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.update({
    id: event.args.proposalId.toString(),
    data: { status: "EXECUTED" },
  });
});
