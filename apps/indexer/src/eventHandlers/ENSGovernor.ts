import { ENSGovernor } from "../../generated/index.js";
import type { Hex, Address } from "viem";

import { ProposalStatus, CONTRACT_ADDRESSES } from "../lib/constants.ts";
import { DaoIdEnum } from "../lib/enums.ts";

import { proposalCreated, updateProposalStatus, voteCast } from "./voting.ts";

const DAO_ID = DaoIdEnum.ENS;
const BLOCK_TIME = CONTRACT_ADDRESSES[DAO_ID].blockTime;

ENSGovernor.VoteCast.handler(async ({ event, context }) => {
  await voteCast(context, DAO_ID, {
    proposalId: event.params.proposalId.toString(),
    voter: event.params.voter as Address,
    reason: event.params.reason,
    support: Number(event.params.support),
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash as Hex,
    votingPower: event.params.weight,
    logIndex: event.logIndex,
  });
});

ENSGovernor.ProposalCreated.handler(async ({ event, context }) => {
  await proposalCreated(context, DAO_ID, BLOCK_TIME, {
    proposalId: event.params.proposalId.toString(),
    txHash: event.transaction.hash as Hex,
    proposer: event.params.proposer as Address,
    targets: [...event.params.targets] as Address[],
    values: [...event.params.values],
    signatures: [...event.params.signatures],
    calldatas: [...event.params.calldatas] as Hex[],
    startBlock: event.params.startBlock.toString(),
    endBlock: event.params.endBlock.toString(),
    description: event.params.description,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number as number),
    logIndex: event.logIndex,
  });
});

ENSGovernor.ProposalCanceled.handler(async ({ event, context }) => {
  await updateProposalStatus(
    context,
    event.params.proposalId.toString(),
    ProposalStatus.CANCELED,
  );
});

ENSGovernor.ProposalExecuted.handler(async ({ event, context }) => {
  await updateProposalStatus(
    context,
    event.params.proposalId.toString(),
    ProposalStatus.EXECUTED,
  );
});

ENSGovernor.ProposalQueued.handler(async ({ event, context }) => {
  await updateProposalStatus(
    context,
    event.params.proposalId.toString(),
    ProposalStatus.QUEUED,
  );
});
