import { ponder } from "@/generated";
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';

ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
  const { Delegation } = context.db;

  await Delegation.create({
    id: event.log.id,
    data: {
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      timestamp: event.block.timestamp,
    },
  });
});

ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  const { Transfer } = context.db;

  await Transfer.create({
    id: event.log.id,
    data: {
      amount: event.args.value,
      from: event.args.from,
      to: event.args.to,
      timestamp: event.block.timestamp,
    },
  });
});

ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
  const { VoteCast } = context.db;

  await VoteCast.create({
    id: event.log.id,
    data: {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      support: event.args.support.toString(),
      weight: event.args.weight.toString(),
      reason: event.args.reason,
    },
  });
});

ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  const { ProposalCreated } = context.db;

  await ProposalCreated.create({
    id: event.log.id,
    data: {
      proposalId: event.args.proposalId.toString(),
      proposer: event.args.proposer,
      targets: event.args.targets,
      values: event.args.values,
      signatures: event.args.signatures,
      calldatas: event.args.calldatas,
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
    },
  });
});
