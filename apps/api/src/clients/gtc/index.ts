import { Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

import { GovernorAbi } from "./abi/governor";

/**
 * Bravo and Alpha proposal ids are small integers. Governor Charlie is an
 * OpenZeppelin governor whose ids are `hashProposal` values, so a 64-bit
 * cutoff tells the two apart without a stored governor column.
 */
export const GTC_CHARLIE_PROPOSAL_ID_MIN = 1n << 64n;

export const isGtcCharlieProposal = (proposalId: string | null): boolean => {
  if (!proposalId) return false;
  try {
    return BigInt(proposalId) >= GTC_CHARLIE_PROPOSAL_ID_MIN;
  } catch {
    return false;
  }
};

/**
 * GTC governance runs on Governor Charlie (the live governor) while finished
 * proposals still live on Governor Bravo. Parameters (voting delay, period,
 * threshold) are read from Charlie through `address`; `quorum()` is read from
 * whichever governor owns the proposal.
 */
export class GTCClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: typeof GovernorAbi;
  protected address: Address;
  private readonly legacyAddress: Address;

  constructor(
    client: Client<TTransport, TChain, TAccount>,
    address: Address,
    legacyAddress: Address,
  ) {
    super(client);
    this.address = address;
    this.legacyAddress = legacyAddress;
    this.abi = GovernorAbi;
  }

  getDaoId(): string {
    return "GTC";
  }

  async getQuorum(proposalId: string | null): Promise<bigint> {
    // null is the DAO's current quorum, which is Charlie's. Bravo ids stay
    // on Bravo so finished proposals are not recomputed against Charlie.
    const governor =
      proposalId == null || isGtcCharlieProposal(proposalId)
        ? this.address
        : this.legacyAddress;

    return this.getCachedQuorum(async () => {
      const blockNumber = await this.getBlockNumber();
      const targetBlock = blockNumber - 10n;
      return this.readContract({
        abi: this.abi,
        address: governor,
        functionName: "quorum",
        args: [targetBlock < 0n ? 0n : targetBlock],
      });
    }, `quorum:${governor}`);
  }

  protected async fetchTimelockDelay(): Promise<bigint> {
    // Both governors execute through the same timelock.
    const timelockAddress = await this.readContract({
      abi: this.abi,
      address: this.legacyAddress,
      functionName: "timelock",
    });
    return this.readContract({
      abi: [
        {
          inputs: [],
          name: "delay",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      address: timelockAddress,
      functionName: "delay",
    });
  }

  async getGracePeriod(): Promise<bigint> {
    return 1209600n; // 14 days
  }

  supportOffchainData(): boolean {
    return true;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
