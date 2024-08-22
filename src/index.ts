import { ponder } from "@/generated";

ponder.on("ENSToken:DelegateChanged", async ({ event, context }) => {
  const { Delegations, Account } = context.db;

  await Delegations.create({
    id: event.log.id,
    data: {
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      timestamp: event.block.timestamp,
    },
  });

  const fromDelegateAccount = await Account.findUnique({ id: event.args.fromDelegate });

  const toDelegateAccount = await Account.findUnique({ id: event.args.toDelegate });
  if (!toDelegateAccount) {
    await Account.create({
      id: event.args.toDelegate,
      data: {
        votingPower: BigInt(0),
        delegationsCount: 0,
      },
    });
  }

  await Account.update({
    id: event.args.toDelegate,
    data: ({ current }) => ({
      votingPower: (current.votingPower ?? BigInt(0)) + BigInt(fromDelegateAccount?.balance ?? BigInt(0)),
      delegationsCount: (current.delegationsCount ?? 0) + 1,
    }),
  });

  const fromDelegateExists = await Account.findUnique({ id: event.args.fromDelegate });
  if (!fromDelegateExists) {
    await Account.create({
      id: event.args.fromDelegate,
      data: {
        votingPower: BigInt(0),
      },
    });
  }

  await Account.update({
    id: event.args.fromDelegate,
    data: {
      votingPower: BigInt(0),
    },
  });
});

ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  const { Transfers, Account } = context.db;

  await Transfers.create({
    id: event.log.id,
    data: {
      amount: event.args.value,
      from: event.args.from,
      to: event.args.to,
      timestamp: event.block.timestamp,
    },
  });

  const fromAccount = await Account.findUnique({ id: event.args.from });
  if (!fromAccount) {
    await Account.create({
      id: event.args.from,
      data: {
        balance: BigInt(0),
        votingPower: BigInt(0),
      },
    });
  }

  await Account.update({
    id: event.args.from,
    data: ({ current }) => ({
      balance: (current.balance ?? BigInt(0)) - BigInt(event.args.value),
      votingPower: (current.votingPower ?? BigInt(0)) - BigInt(event.args.value),
    }),
  });

  const toAccount = await Account.findUnique({ id: event.args.to });
  if (!toAccount) {
    await Account.create({
      id: event.args.to,
      data: {
        balance: BigInt(0),
        votingPower: BigInt(0),
      },
    });
  }

  await Account.update({
    id: event.args.to,
    data: ({ current }) => ({
      balance: (current.balance ?? BigInt(0)) + BigInt(event.args.value),
      votingPower: (current.votingPower ?? BigInt(0)) + BigInt(event.args.value),
    }),
  });
});

ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
  const { VotesOnchain, Account } = context.db;

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

  const voterAccount = await Account.findUnique({ id: event.args.voter });
  if (!voterAccount) {
    await Account.create({
      id: event.args.voter,
      data: {
        votesCount: 0,
      },
    });
  }

  await Account.update({
    id: event.args.voter,
    data: ({ current }) => ({
      votesCount: (current.votesCount ?? 0) + 1,
    }),
  });

});

ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  const { ProposalsOnchain, Account } = context.db;

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

  const proposerAccount = await Account.findUnique({ id: event.args.proposer });
  if (!proposerAccount) {
    await Account.create({
      id: event.args.proposer,
      data: {
        proposalCount: 0,
      },
    });
  }

  await Account.update({
    id: event.args.proposer,
    data: ({ current }) => ({
      proposalCount: (current.proposalCount ?? 0) + 1,
    }),
  });
});

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
