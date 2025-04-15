import { ponder } from "ponder:registry";
import { dao, daoToken, token } from "ponder:schema";
import { Address, Client } from "viem";

import { ARBTokenAbi } from "./abi";
import { DaoIdEnum } from "@/lib/enums";
import { tokenTransfer } from "@/lib/event-handlers";
import { readContract } from "viem/actions";

export function ArbIndexer(client: Client, tokenAddress: Address) {
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

    const decimals = await readContract(client, {
      abi: ARBTokenAbi,
      functionName: "decimals",
      address: tokenAddress,
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
    await tokenTransfer(event, context, daoId, tokenAddress);
  });
}
