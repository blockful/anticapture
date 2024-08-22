import { ponder } from "@/generated";

ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
  const { Delegations } = context.db;

  await Delegations.create({
    id: event.log.id,
    data: {
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      timestamp: event.block.timestamp,
    },
  });
});

ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  const { Transfers } = context.db;

  await Transfers.create({
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
  const { VotesOnchain } = context.db;

  await VotesOnchain.create({
    id: event.log.id,
    data: {
      proposalId: event.args.proposalId.toString(),
      voter: event.args.voter,
      support: event.args.support.toString(),
      weight: event.args.weight.toString(),
      reason: event.args.reason,
      timestamp: event.block.timestamp,
    },
  });
});

ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.create({
    id: event.args.proposalId.toString(),
    data: {
      proposer: event.args.proposer,
      targets: event.args.targets,
      values: event.args.values,
      signatures: event.args.signatures,
      calldatas: event.args.calldatas,
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
      status: "Pending",
    },
  });
});
/**/
ponder.on("ENSGovernor:ProposalCanceled", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.update({
    id: event.args.proposalId.toString(),
    data: { status: "CANCELED" },
  });
});

ponder.on("ENSGovernor:ProposalExecuted", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.update({
    id: event.args.proposalId.toString(),
    data: { status: "EXECUTED" },
  });
});
