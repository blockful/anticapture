/**
 * @file index.ts
 * @description This file contains Ponder event handlers for COMP (Ethereum Name Service) related smart contracts.
 * It indexes various events such as delegate changes, transfers, votes, and proposal actions.
 *
 */

import { ponder } from "@/generated";

ponder.on("COMPToken:DelegateChanged", async ({ event, context }) => {
  const { Delegations, Account } = context.db;

  // Create a new delegation record
  await Delegations.create({
    id: event.log.id,
    data: {
      dao: "COMP",
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegator's delegate
  await Account.upsert({
    id: event.args.delegator,
    create: {
      COMPDelegate: event.args.toDelegate,
    },
    update: () => ({
      COMPDelegate: event.args.toDelegate,
    }),
  });

  // Update the delegatee's delegations count
  await Account.upsert({
    id: event.args.toDelegate,
    create: {
      COMPDelegationsCount: 1,
    },
    update: ({ current }) => ({
      COMPDelegationsCount: (current.COMPDelegationsCount ?? 0) + 1,
    }),
  });
});

ponder.on("COMPToken:DelegateVotesChanged", async ({ event, context }) => {
  const { VotingPowerHistory, Account } = context.db;

  // Create a new voting power history record
  await VotingPowerHistory.create({
    id: event.log.id,
    data: {
      account: event.args.delegate,
      dao: "COMP",
      votingPower: event.args.newBalance,
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegate's voting power
  await Account.upsert({
    id: event.args.delegate,
    create: {
      COMPVotingPower: event.args.newBalance,
    },
    update: () => ({
      COMPVotingPower: event.args.newBalance,
    }),
  });
});

/**
 * Handler for Transfer event of COMPToken contract
 * Creates a new Transfer record and updates Account balances
 */
ponder.on("COMPToken:Transfer", async ({ event, context }) => {
  const { Transfers, Account } = context.db;

  // Create a new transfer record
  await Transfers.create({
    id: event.log.id,
    data: {
      dao: "COMP",
      amount: event.args.amount,
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
        COMPBalance: BigInt(event.args.amount),
      },
      update: ({ current }) => ({
        COMPBalance:
          (current.COMPBalance ?? BigInt(0)) - BigInt(event.args.amount),
      }),
    });

    // Check if the balances are valid
    if (fromAccount.COMPBalance! < BigInt(0)) {
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
      COMPBalance: BigInt(event.args.amount),
    },
    update: ({ current }) => ({
      COMPBalance: (current.COMPBalance ?? BigInt(0)) + BigInt(event.args.amount),
    }),
  });
});

