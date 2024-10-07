import { ponder } from "@/generated";

ponder.on("SHUToken:DelegateChanged", async ({ event, context }) => {
  const { Delegations, Account } = context.db;

  // Create a new delegation record
  await Delegations.create({
    id: event.log.id,
    data: {
      delegatee: event.args.toDelegate,
      delegator: event.args.delegator,
      dao: "SHU",
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegator's delegate
  await Account.upsert({
    id: event.args.delegator,
    create: {
      SHUDelegate: event.args.toDelegate,
    },
    update: () => ({
      SHUDelegate: event.args.toDelegate,
    }),
  });

  // Update the delegatee's delegations count
  await Account.upsert({
    id: event.args.toDelegate,
    create: {
      SHUDelegationsCount: 1,
    },
    update: ({ current }) => ({
      SHUDelegationsCount: (current.SHUDelegationsCount ?? 0) + 1,
    }),
  });
});

ponder.on("SHUToken:DelegateVotesChanged", async ({ event, context }) => {
  const { VotingPowerHistory, Account } = context.db;

  // Create a new voting power history record
  await VotingPowerHistory.create({
    id: event.log.id,
    data: {
      account: event.args.delegate,
      dao: "SHU",
      votingPower: event.args.newVotes,
      timestamp: event.block.timestamp,
    },
  });

  // Update the delegate's voting power
  await Account.upsert({
    id: event.args.delegate,
    create: {
      SHUVotingPower: event.args.newVotes,
    },
    update: () => ({
      SHUVotingPower: event.args.newVotes,
    }),
  });
});

ponder.on("SHUToken:Transfer", async ({ event, context }) => {
  const { Transfers, Account } = context.db;

  // Create a new transfer record
  await Transfers.create({
    id: event.log.id,
    data: {
      amount: event.args.value,
      dao: "SHU",
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
        SHUBalance: BigInt(event.args.value),
      },
      update: ({ current }) => ({
        SHUBalance:
          (current.SHUBalance ?? BigInt(0)) - BigInt(event.args.value),
      }),
    });

    // Check if the balances are valid
    if (fromAccount.SHUBalance! < BigInt(0)) {
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
      SHUBalance: BigInt(event.args.value),
    },
    update: ({ current }) => ({
      SHUBalance: (current.SHUBalance ?? BigInt(0)) + BigInt(event.args.value),
    }),
  });
});
