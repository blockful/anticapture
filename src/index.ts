/**
 * @file index.ts
 * @description This file contains Ponder event handlers for ENS (Ethereum Name Service) related smart contracts.
 * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
 *
 */

import { ponder } from "@/generated";

/**
 * Handler for DelegateVotesChanged event of ENSToken contract
 * Updates or creates an Account with new voting power
 */
ponder.on("ENSToken:DelegateVotesChanged", async ({ event, context }) => {
  const { Account } = context.db;

  const delegateAccount = await Account.findUnique({
    id: event.args.delegate,
  });

  if (!delegateAccount) {
    await Account.create({
      id: event.args.delegate,
      data: {
        votingPower: BigInt(event.args.newBalance),
      },
    });
  } else {
    await Account.update({
      id: event.args.delegate,
      data: {
        votingPower: BigInt(event.args.newBalance),
      },
    });
  }
});

/**
 * Handler for DelegateChanged event of ENSToken contract
 * Creates a new Delegation record
 */
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

/**
 * Handler for Transfer event of ENSToken contract
 * Creates a new Transfer record and updates Account balances
 */
ponder.on("ENSToken:Transfer", async ({ event, context }) => {
  const { Transfers, Account } = context.db;

  // Create transfer record
  await Transfers.create({
    id: event.log.id,
    data: {
      amount: event.args.value,
      from: event.args.from,
      to: event.args.to,
      timestamp: event.block.timestamp,
    },
  });

  // Update or create 'from' account
  const fromAccount = await Account.findUnique({ id: event.args.from });
  if (!fromAccount) {
    await Account.create({
      id: event.args.from,
      data: {
        balance: BigInt(0),
      },
    });
  }
  await Account.update({
    id: event.args.from,
    data: ({ current }) => ({
      balance: (current.balance ?? BigInt(0)) - BigInt(event.args.value),
    }),
  });

  // Update or create 'to' account
  const toAccount = await Account.findUnique({ id: event.args.to });
  if (!toAccount) {
    await Account.create({
      id: event.args.to,
      data: {
        balance: BigInt(event.args.value),
      },
    });
  } else {
    await Account.update({
      id: event.args.to,
      data: ({ current }) => ({
        balance: (current.balance ?? BigInt(0)) + BigInt(event.args.value),
      }),
    });
  }
});

/**
 * Handler for VoteCast event of ENSGovernor contract
 * Creates a new VotesOnchain record and updates the voter's vote count
 */
ponder.on("ENSGovernor:VoteCast", async ({ event, context }) => {
  const { VotesOnchain, Account } = context.db;

  // Create vote record
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

  // Update or create voter account
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

/**
 * Handler for ProposalCreated event of ENSGovernor contract
 * Creates a new ProposalsOnchain record and updates the proposer's proposal count
 */
ponder.on("ENSGovernor:ProposalCreated", async ({ event, context }) => {
  const { ProposalsOnchain, Account } = context.db;

  // Create proposal record
  await ProposalsOnchain.create({
    id: event.args.proposalId.toString(),
    data: {
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
    },
  });

  // Update or create proposer account
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
