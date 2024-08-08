import { ponder } from "@/generated";

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
