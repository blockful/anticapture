export function SHUGovernorIndexer(_blockTime: number) {
  // const daoId = DaoIdEnum.SHU;
  //
  // ponder.on(`LinearVotingStrategy:Voted`, async ({ event, context }) => {
  //   await voteCast(context, daoId, {
  //     proposalId: event.args.proposalId.toString(),
  //     voter: event.args.voter,
  //     reason: "",
  //     support: event.args.voteType,
  //     timestamp: event.block.timestamp,
  //     txHash: event.transaction.hash,
  //     votingPower: event.args.weight,
  //   });
  // });
  //
  // ponder.on(
  //   `LinearVotingStrategy:ProposalInitialized`,
  //   async ({ event, context }) => {
  //     await proposalCreated(context, daoId, blockTime, {
  //       proposalId: event.args.proposalId.toString(),
  //       txHash: event.transaction.hash,
  //       proposer: event.args.proposer,
  //       targets: [...event.args.targets],
  //       values: [...event.args.values],
  //       signatures: [...event.args.signatures],
  //       calldatas: [...event.args.calldatas],
  //       startBlock: event.args.voteStart.toString(),
  //       endBlock: event.args.voteEnd.toString(),
  //       description: event.args.description,
  //       timestamp: event.block.timestamp,
  //     });
  //   },
  // );
  //
  // ponder.on(`Azorius:ProposalCreated`, async ({ event, context }) => {
  //   const targets: `0x${string}`[] = [];
  //   const values: bigint[] = [];
  //   const calldatas: `0x${string}`[] = [];
  //
  //   event.args.transactions.forEach((transaction) => {
  //     targets.push(transaction.to);
  //     values.push(transaction.value);
  //     calldatas.push(transaction.data);
  //   });
  //
  //   await proposalCreated(context, daoId, blockTime, {
  //     proposalId: event.args.proposalId.toString(),
  //     txHash: event.transaction.hash,
  //     proposer: event.args.proposer,
  //     targets: targets,
  //     values: values,
  //     signatures: [],
  //     calldatas: calldatas,
  //     startBlock: event.args.voteStart.toString(),
  //     endBlock: event.args.voteEnd.toString(),
  //     description: event.args.description,
  //     timestamp: event.block.timestamp,
  //   });
  // });
  //
  // ponder.on(`Azorius:ProposalExecuted`, async ({ event, context }) => {
  //   await updateProposalStatus(
  //     context,
  //     event.args.proposalId.toString(),
  //     ProposalStatus.EXECUTED,
  //   );
  // });
}
