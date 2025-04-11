import { ponder } from "ponder:registry";
import { dao, daoToken, token } from "ponder:schema";
import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";
import { tokenTransfer } from "@/lib/event-handlers";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { ARBTokenAbi } from "./abi";
import { readContract } from "viem/actions";

const daoId = DaoIdEnum.ARB;
const network = NetworkEnum.ARBITRUM;
const tokenAddress = CONTRACT_ADDRESSES[network][daoId]!.token;

const client = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

ponder.on("ARBToken:setup", async ({ context }) => {
  await context.db.insert(dao).values({
    id: daoId,
    votingPeriod: BigInt(0),
    quorum: BigInt(0),
    votingDelay: BigInt(0),
    timelockDelay: BigInt(0),
    proposalThreshold: BigInt(0),
  });
  const decimals = await readContract(client, {
    abi: ARBTokenAbi,
    address: tokenAddress,
    functionName: "decimals",
  });

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
