import {
  Address,
  encodeFunctionData,
  formatEther,
  Hash,
  Hex,
  PublicClient,
} from "viem";
import pino from "pino";

import { governorAbi, ProposalState } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import { Errors } from "@/errors";
import { RateLimiter } from "@/lib/rate-limiter";
import { RelayerSigner } from "@/signer/types";

import { ChainStateService } from "./chain-state";
import { EligibilityService } from "./eligibility";
import { SignatureVerifier } from "./signature-verifier";

const logger = pino({ name: "relay-service" });

export interface RelayVoteParams {
  proposalId: bigint;
  support: number;
  v: number;
  r: Hex;
  s: Hex;
  expectedVoter?: Address; // Optional pre-flight check against griefing
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
    private signatureVerifier: SignatureVerifier,
    private eligibility: EligibilityService,
    private chainState: ChainStateService,
    private rateLimiter: RateLimiter,
    private publicClient: PublicClient,
    private minBalanceWei: bigint,
    private governorAddress: Address,
    private tokenAddress: Address,
  ) {}

  async relayVote(params: RelayVoteParams): Promise<RelayResult> {
    // 0. Check relayer has enough balance
    await this.assertSufficientBalance();

    // 1. Recover voter from signature
    const voter = await this.signatureVerifier.recoverVoteSigner(params);

    // 2. Rate limit (read-only check — doesn't consume a slot)
    this.rateLimiter.checkAllowed(voter);

    // 3. Eligibility
    await this.eligibility.assertCanVote(voter);

    // 4. On-chain state checks
    const state = await this.chainState.getProposalState(params.proposalId);
    if (state !== ProposalState.Active) {
      throw Errors.PROPOSAL_NOT_ACTIVE();
    }

    const alreadyVoted = await this.chainState.hasVoted(
      params.proposalId,
      voter,
    );
    if (alreadyVoted) {
      throw Errors.ALREADY_VOTED();
    }

    // 5. Submit transaction
    const data = encodeFunctionData({
      abi: governorAbi,
      functionName: "castVoteBySig",
      args: [params.proposalId, params.support, params.v, params.r, params.s],
    });

    const hash = await this.signer.sendTransaction({
      to: this.governorAddress,
      data,
    });

    // 6. Record usage AFTER successful submission
    this.rateLimiter.recordUsage(voter);

    return { hash, signer: voter };
  }

  async relayDelegation(params: RelayDelegateParams): Promise<RelayResult> {
    // 0. Check relayer has enough balance
    await this.assertSufficientBalance();

    // 1. Recover delegator from signature
    const delegator =
      await this.signatureVerifier.recoverDelegationSigner(params);

    // 2. Rate limit (read-only check)
    this.rateLimiter.checkAllowed(delegator);

    // 3. Eligibility
    await this.eligibility.assertCanDelegate(delegator);

    // 4. On-chain checks
    if (params.expiry <= BigInt(Math.floor(Date.now() / 1000))) {
      throw Errors.SIGNATURE_EXPIRED();
    }

    const onChainNonce = await this.chainState.getDelegationNonce(delegator);
    if (params.nonce !== onChainNonce) {
      throw Errors.NONCE_MISMATCH(
        onChainNonce.toString(),
        params.nonce.toString(),
      );
    }

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

    const hash = await this.signer.sendTransaction({
      to: this.tokenAddress,
      data,
    });

    // 6. Record usage AFTER successful submission
    this.rateLimiter.recordUsage(delegator);

    return { hash, signer: delegator };
  }

  private async assertSufficientBalance(): Promise<void> {
    const balance = await this.publicClient.getBalance({
      address: this.signer.address,
    });

    if (balance < this.minBalanceWei) {
      logger.warn(
        {
          address: this.signer.address,
          balance: formatEther(balance),
          threshold: formatEther(this.minBalanceWei),
        },
        "Relayer balance below threshold",
      );
      throw Errors.RELAYER_LOW_BALANCE();
    }
  }
}
