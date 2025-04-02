import { ponder } from "ponder:registry";
import {
  delegateChanged,
  delegatedVotesChanged,
  tokenTransfer,
} from "@/lib/event-handlers";
import viemClient from "@/lib/viemClient";
import { dao, daoToken, token } from "ponder:schema";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { Address } from "viem";

const daoId = DaoIdEnum.ARB;
const network = NetworkEnum.ARBITRUM;
const tokenAddress = viemClient.daoConfigParams[network][daoId]
  ?.tokenAddress as Address;

ponder.on("ARBToken:setup", async ({ context }) => {
  await context.db.insert(dao).values({
    id: daoId,
    votingPeriod: BigInt(0),
    quorum: BigInt(0),
    votingDelay: BigInt(0),
    timelockDelay: BigInt(0),
    proposalThreshold: BigInt(0),
  });
  const decimals = await viemClient.getDecimals(daoId, network);

  await context.db.insert(token).values({
    id: tokenAddress,
    name: daoId,
    decimals: decimals as number,
    totalSupply: BigInt(0),
    delegatedSupply: BigInt(0),
    cexSupply: BigInt(0),
    dexSupply: BigInt(0),
    lendingSupply: BigInt(0),
    circulatingSupply: BigInt(0),
    treasury: BigInt(0),
  });
  await context.db.insert(daoToken).values({
    id: daoId + "-" + tokenAddress,
    daoId,
    tokenId: tokenAddress,
  });
});

ponder.on("ARBToken:Transfer", async ({ event, context }) => {
  await tokenTransfer(event, context, daoId, network);
});
