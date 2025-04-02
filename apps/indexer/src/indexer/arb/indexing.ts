import { ponder } from "ponder:registry";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/lib/event-handlers";
import viemClient from "@/lib/viemClient";
import { dao, daoToken, token } from "ponder:schema";
import { DaoIdEnum } from "@/lib/enums";

const daoId = DaoIdEnum.ARB;

ponder.on("ARBToken:setup", async ({ context }) => {
  await context.db.insert(dao).values({
    id: daoId,
    votingPeriod: BigInt(0),
    quorum: BigInt(0),
    votingDelay: BigInt(0),
    timelockDelay: BigInt(0),
    proposalThreshold: BigInt(0),
  });
  const decimals = await viemClient.getDecimals(DaoIdEnum.ARB);
  const arbTokenAddress = viemClient.daoConfigParams[daoId].tokenAddress;
  await context.db.insert(token).values({
    id: arbTokenAddress,
    name: daoId,
    decimals,
    totalSupply: BigInt(0),
    delegatedSupply: BigInt(0),
    cexSupply: BigInt(0),
    dexSupply: BigInt(0),
    lendingSupply: BigInt(0),
    circulatingSupply: BigInt(0),
    treasury: BigInt(0),
  });
  await context.db.insert(daoToken).values({
    id: daoId + "-" + arbTokenAddress,
    daoId,
    tokenId: arbTokenAddress,
  });
});

ponder.on("ARBToken:DelegateChanged", async ({ event, context }) => {
  await delegateChanged(event, context, daoId);
});

ponder.on("ARBToken:DelegateVotesChanged", async ({ event, context }) => {
  await delegatedVotesChanged(event, context, daoId);
});

ponder.on("ARBToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId);
});
