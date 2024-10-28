import { ponder } from "@/generated";

ponder.on("UNIToken:DelegateChanged", async ({ event, context }) => {
  const { Delegations, Account } = context.db;

  // Create a new delegation record
  await Delegations.create({
    id: event.log.id,
    data: {
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      dao: "UNI",
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegator's delegate
  await Account.upsert({
    id: event.args.delegator,
    create: {
      UNIDelegate: event.args.toDelegate,
    },
    update: () => ({
      UNIDelegate: event.args.toDelegate,
    }),
  });

  // Update the delegatee's delegations count
  await Account.upsert({
    id: event.args.toDelegate,
    create: {
      UNIDelegationsCount: 1,
    },
    update: ({ current }) => ({
      UNIDelegationsCount: (current.UNIDelegationsCount ?? 0) + 1,
    }),
  });
});

ponder.on("UNIToken:DelegateVotesChanged", async ({ event, context }) => {
  const { VotingPowerHistory, Account } = context.db;

  // Create a new voting power history record
  await VotingPowerHistory.create({
    id: event.log.id,
    data: {
      account: event.args.delegate,
      dao: "UNI",
      votingPower: event.args.newBalance,
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegate's voting power
  await Account.upsert({
    id: event.args.delegate,
    create: {
      UNIVotingPower: event.args.newBalance,
    },
    update: () => ({
      UNIVotingPower: event.args.newBalance,
    }),
  });
});

ponder.on("UNIToken:Transfer", async ({ event, context }) => {
  const { Transfers, Account } = context.db;

  // Create a new transfer record
  await Transfers.create({
    id: event.log.id,
    data: {
      amount: event.args.amount,
      dao: "UNI",
      from: event.args.from,
      to: event.args.to,
      timestamp: event.block.timestamp,
    },
  });

  // Update the from account's balance
  if (event.args.from !== "0x0000000000000000000000000000000000000000") {
    const fromAccount = await Account.upsert({
      id: event.args.from,
      create: {
        UNIBalance: BigInt(event.args.amount),
      },
      update: ({ current }) => ({
        UNIBalance:
          (current.UNIBalance ?? BigInt(0)) - BigInt(event.args.amount),
      }),
    });

    // Check if the balances are valid
    if (fromAccount.UNIBalance! < BigInt(0)) {
      console.log(`Invalid balance for ${event.args.from}`);
      console.log(
        "evaluation",
        event.args.from !== "0x0000000000000000000000000000000000000000",
      );
      throw new Error(`Invalid balance`);
    }
  }

  // Update the to account's balance
  const toAccount = await Account.upsert({
    id: event.args.to,
    create: {
      UNIBalance: BigInt(event.args.amount),
    },
    update: ({ current }) => ({
      UNIBalance: (current.UNIBalance ?? BigInt(0)) + BigInt(event.args.amount),
    }),
  });
});

ponder.on("UNIGovernor:VoteCast", async ({ event, context }) => {
  const { VotesOnchain, Account, ProposalsOnchain } = context.db;

  await Account.upsert({
    id: event.args.voter,
    create: {
      UNIVotesCount: 1,
    },
    update: ({ current }) => ({
      UNIVotesCount: (current.UNIVotesCount ?? 0) + 1,
    }),
  });

  // Create vote record
  await VotesOnchain.create({
    id: event.log.id,
    data: {
      dao: "UNI",
      proposalId: "UNI" + event.args.proposalId.toString(),
      voter: event.args.voter,
      support: event.args.support.toString(),
      weight: event.args.votes.toString(),
      reason: event.args.reason,
      timestamp: event.block.timestamp,
    },
  });

  await ProposalsOnchain.update({
    id: "UNI" + event.args.proposalId.toString(),
    data: ({ current }) => ({
      forVotes:
        (current.forVotes ?? BigInt(0)) +
        (event.args.support === 0 ? event.args.votes : BigInt(0)),
      againstVotes:
        (current.againstVotes ?? BigInt(0)) +
        (event.args.support === 1 ? event.args.votes : BigInt(0)),
    }),
  });
});

/**
 * Handler for ProposalCreated event of UNIGovernor contract
 * Creates a new ProposalsOnchain record and updates the proposer's proposal count
 */
ponder.on("UNIGovernor:ProposalCreated", async ({ event, context }) => {
  const { ProposalsOnchain, Account } = context.db;

  // Create proposal record
  await ProposalsOnchain.create({
    id: "UNI" + event.args.id.toString(),
    data: {
      dao: "UNI",
      proposer: event.args.proposer,
      targets: JSON.stringify(event.args.targets),
      values: JSON.stringify(event.args.values.map((v) => v.toString())),
      signatures: JSON.stringify(event.args.signatures),
      calldatas: JSON.stringify(event.args.calldatas),
      startBlock: event.args.startBlock.toString(),
      endBlock: event.args.endBlock.toString(),
      description: event.args.description,
      timestamp: event.block.timestamp,
      status: "PENDING",
      forVotes: BigInt(0),
      againstVotes: BigInt(0),
      abstainVotes: BigInt(0),
    },
  });

  await Account.upsert({
    id: event.args.proposer,
    create: {
      UNIProposalCount: 1,
    },
    update: ({ current }) => ({
      UNIProposalCount: (current.UNIProposalCount ?? 0) + 1,
    }),
  });
});

/**
 * Handler for ProposalCanceled event of UNIGovernor contract
 * Updates the status of a proposal to CANCELED
 */
ponder.on("UNIGovernor:ProposalCanceled", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.update({
    id: "UNI" + event.args.id.toString(),
    data: ({ current }) => ({
      status: "CANCELED",
    }),
  });
});


/**
 * Handler for ProposalExecuted event of UNIGovernor contract
 * Updates the status of a proposal to EXECUTED
 */
ponder.on("UNIGovernor:ProposalExecuted", async ({ event, context }) => {
  const { ProposalsOnchain } = context.db;

  await ProposalsOnchain.update({
    id: "UNI" + event.args.id.toString(),
    data: ({ current }) => ({
      status: "EXECUTED",
    }),
  });
});
