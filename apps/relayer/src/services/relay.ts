import {
  Address,
  BaseError,
  encodeFunctionData,
  Hash,
  Hex,
  InsufficientFundsError,
} from "viem";

import { governorAbi } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import { Errors } from "@/errors";
import type { IRateLimiter } from "@/services/guards/rate-limiter";
import { RelayerSigner } from "@/signer/types";

import type { ChainReader } from "./chain/chain-reader";
import type { IChainStateService } from "./chain/chain-state";
import type { ISignatureVerifier } from "./guards/signature-verifier";

export interface RelayVoteParams {
  proposalId: bigint;
  support: number;
  v: number;
  r: Hex;
  s: Hex;
  expectedVoter?: Address;
}

export interface RelayDelegateParams {
  delegatee: Address;
  nonce: bigint;
  expiry: bigint;
  v: number;
  r: Hex;
  s: Hex;
}

export interface RelayResult {
  hash: Hash;
  signer: Address;
}

export class RelayService {
  constructor(
    private signer: RelayerSigner,
    private signatureVerifier: ISignatureVerifier,
    private chainState: IChainStateService,
    private rateLimiter: IRateLimiter,
    private publicClient: ChainReader,
    private minVotingPower: bigint,
    private governorAddress: Address,
    private tokenAddress: Address,
  ) {}

  async relayVote(params: RelayVoteParams): Promise<RelayResult> {
    // 1. Recover voter from signature
    const voter = await this.signatureVerifier.recoverVoteSigner(params);

    // 2. Eligibility — on-chain vote weight is getVotes(), so a holder who
    //    never delegated would cost the relayer gas for a zero-weight vote.
    const votingPower = await this.chainState.getVotingPower(voter);
    if (votingPower < this.minVotingPower) {
      throw Errors.INSUFFICIENT_VOTING_POWER(this.minVotingPower.toString());
    }

    // 3. Rate-limit check — after eligibility, before simulation/submission
    await this.rateLimiter.assertWithinLimit(voter, "vote");

    // 4. Simulate the call. Covers: proposal state, hasVoted, signature validity.
    await this.publicClient.simulateContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "castVoteBySig",
      args: [params.proposalId, params.support, params.v, params.r, params.s],
      account: this.signer.address,
    });

    // 5. Submit transaction
    const data = encodeFunctionData({
      abi: governorAbi,
      functionName: "castVoteBySig",
      args: [params.proposalId, params.support, params.v, params.r, params.s],
    });

    const hash = await this.sendTransaction({
      to: this.governorAddress,
      data,
    });

    return { hash, signer: voter };
  }

  async relayDelegation(params: RelayDelegateParams): Promise<RelayResult> {
    // 1. Recover delegator from signature
    const delegator =
      await this.signatureVerifier.recoverDelegationSigner(params);

    // 2. Eligibility — validated before a rate-limit slot is spent
    await this.assertDelegationEligible(delegator);

    // 3. Rate-limit check — after eligibility, before simulation/submission
    await this.rateLimiter.assertWithinLimit(delegator, "delegation");

    // 4. Simulate the call. Covers: nonce match, signature validity, expiry.
    await this.publicClient.simulateContract({
      address: this.tokenAddress,
      abi: erc20VotesAbi,
      functionName: "delegateBySig",
      args: [
        params.delegatee,
        params.nonce,
        params.expiry,
        params.v,
        params.r,
        params.s,
      ],
      account: this.signer.address,
    });

    // 5. Submit transaction
    const data = encodeFunctionData({
      abi: erc20VotesAbi,
      functionName: "delegateBySig",
      args: [
        params.delegatee,
        params.nonce,
        params.expiry,
        params.v,
        params.r,
        params.s,
      ],
    });

    const hash = await this.sendTransaction({
      to: this.tokenAddress,
      data,
    });

    return { hash, signer: delegator };
  }

  /**
   * Delegation accepts voting power OR raw token balance. The balance fallback
   * covers first-time delegators, whose getVotes() is 0 until they delegate at
   * least once.
   */
  private async assertDelegationEligible(address: Address): Promise<void> {
    const [votingPower, balance] = await Promise.all([
      this.chainState.getVotingPower(address),
      this.chainState.getTokenBalance(address),
    ]);

    if (votingPower < this.minVotingPower && balance < this.minVotingPower) {
      throw Errors.INSUFFICIENT_VOTING_POWER(this.minVotingPower.toString());
    }
  }

  /**
   * Wraps the signer so viem's InsufficientFundsError surfaces as a clean
   * 503 RELAYER_LOW_BALANCE instead of bubbling up as a 500.
   */
  private async sendTransaction(tx: { to: Address; data: Hex }): Promise<Hash> {
    try {
      return await this.signer.sendTransaction(tx);
    } catch (err) {
      if (
        err instanceof BaseError &&
        err.walk((e) => e instanceof InsufficientFundsError)
      ) {
        throw Errors.RELAYER_LOW_BALANCE();
      }
      throw err;
    }
  }
}
