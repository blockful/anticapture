import { ponder } from "ponder:registry";
import { dao, daoToken, token } from "ponder:schema";
import { Address } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { ARBTokenAbi } from "./abi";

export class ARBIndexer {
  private daoId: DaoIdEnum = DaoIdEnum.ARB;
  private tokenAddress: Address;

  constructor(tokenAddress: Address) {
    this.tokenAddress = tokenAddress;

    ponder.on("ARBToken:setup", async ({ context }) => {
      await context.db.insert(dao).values({
        id: this.daoId,
        votingPeriod: BigInt(0),
        quorum: BigInt(0),
        votingDelay: BigInt(0),
        timelockDelay: BigInt(0),
        proposalThreshold: BigInt(0),
      });

      const decimals = await context.client.readContract({
        abi: ARBTokenAbi,
        address: this.tokenAddress,
        functionName: "decimals",
      });

      console.log({ decimals });

      await context.db.insert(token).values({
        id: this.tokenAddress,
        name: this.daoId,
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
        id: this.daoId + "-" + this.tokenAddress,
        daoId: this.daoId,
        tokenId: this.tokenAddress,
      });
    });
  }
}
