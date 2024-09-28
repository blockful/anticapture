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
