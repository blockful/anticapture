import { Address, Chain, createPublicClient, http, parseAbi } from "viem";
import { mainnet, arbitrum, optimism, scroll } from "viem/chains";

import { DAO_ID } from "../types";

export default class EthereumClient {

  async getSignersVotingPower(daoId: DAO_ID, signers: Address[]): Promise<bigint> {
    const client = createPublicClient({
      transport: http(),
      chain: this.getChain(daoId),
    })
    const calls = signers.map((signer) => ({
      address: this.getTokenAddress(daoId),
      abi: parseAbi(["function balanceOf(address) returns (uint256)"]),
      functionName: "balanceOf",
      args: [signer]
    }));

    const votingPowers = await client.multicall({
      contracts: calls,
    });

    return votingPowers.reduce((sum, { status, result }) => status === 'success' ? sum + result : sum, 0n);
  }

  getChain(daoId: DAO_ID): Chain {
    switch (daoId) {
      case "ARB":
        return arbitrum
      case "OP":
        return optimism
      case "SCR":
        return scroll
      case "GTC":
      default:
        return mainnet
    }
  }

  getTokenAddress(daoId: DAO_ID): Address {
    switch (daoId) {
      case "ENS":
        return "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"
      case "UNI":
        return "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
      case "ARB":
        return "0x912CE59144191C1204E64559FE8253a0e49E6548"
      case "SCR":
        return "0xd29687c813d741e2f938f4ac377128810e217b1b"
      case "GTC":
        return "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f"
      case "OP":
        return "0x4200000000000000000000000000000000000042"
      default:
        throw new Error(`Unsupported DAO ID: ${daoId}`)
    }
  }
}