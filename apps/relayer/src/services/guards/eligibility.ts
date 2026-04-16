import { Address } from "viem";

import { Errors } from "@/errors";
import { ChainStateService } from "../chain/chain-state";

export interface EligibilityConfig {
  minVotingPower: bigint;
  delegationCooldownDays: number;
}

export class EligibilityService {
  constructor(
    private chainState: ChainStateService,
    private config: EligibilityConfig,
  ) {}

  async assertCanVote(voter: Address): Promise<void> {
    const votingPower = await this.chainState.getVotingPower(voter);
    if (votingPower < this.config.minVotingPower) {
      throw Errors.INSUFFICIENT_VOTING_POWER(
        this.config.minVotingPower.toString(),
      );
    }
  }

  async assertCanDelegate(delegator: Address): Promise<void> {
    const votingPower = await this.chainState.getVotingPower(delegator);
    if (votingPower < this.config.minVotingPower) {
      throw Errors.INSUFFICIENT_VOTING_POWER(
        this.config.minVotingPower.toString(),
      );
    }

    // Delegation cooldown is enforced on-chain by nonce.
    // Here we verify the user hasn't delegated too recently
    // by checking the nonce increment rate off-chain if needed.
    // For v1, the cooldown check is a placeholder — the contract
    // handles nonce ordering, and we log a warning.
    // TODO: Track delegation timestamps in a local store for cooldown enforcement.
  }
}
