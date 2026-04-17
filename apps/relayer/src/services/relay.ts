import { Address, encodeFunctionData, formatEther, Hash, Hex } from "viem";
import pino from "pino";

import { governorAbi, ProposalState } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import { Errors } from "@/errors";
import type { IRateLimiter } from "@/services/guards/rate-limiter";
import { RelayerSigner } from "@/signer/types";

import type { ChainReader } from "./chain/chain-reader";
import type { IChainStateService } from "./chain/chain-state";
import type { ISignatureVerifier } from "./guards/signature-verifier";

const logger = pino({ name: "relay-service" });

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
    private minBalanceWei: bigint,
    private minVotingPower: bigint,
    private governorAddress: Address,
    private tokenAddress: Address,
  ) {}

  async relayVote(params: RelayVoteParams): Promise<RelayResult> {
    // 0. Check relayer has enough balance
    await this.assertSufficientBalance();

    // 1. Recover voter from signature
    const voter = await this.signatureVerifier.recoverVoteSigner(params);

    // 2. Eligibility — validation before slot is spent
    await this.assertSufficientVotingPower(voter);

    // 3. On-chain state checks
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

    // 4. Rate-limit check — after validation, before submission
    await this.rateLimiter.assertWithinLimit(voter, "vote");

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

    return { hash, signer: voter };
  }

  async relayDelegation(params: RelayDelegateParams): Promise<RelayResult> {
    // 0. Check relayer has enough balance
    await this.assertSufficientBalance();

    // 1. Recover delegator from signature
    const delegator =
      await this.signatureVerifier.recoverDelegationSigner(params);

    // 2. Eligibility — validation before slot is spent
    await this.assertSufficientVotingPower(delegator);

    // 3. On-chain checks
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

    // 4. Rate-limit check — after validation, before submission
    await this.rateLimiter.assertWithinLimit(delegator, "delegation");

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

    return { hash, signer: delegator };
  }

  private async assertSufficientVotingPower(address: Address): Promise<void> {
    const votingPower = await this.chainState.getVotingPower(address);
    if (votingPower < this.minVotingPower) {
      throw Errors.INSUFFICIENT_VOTING_POWER(this.minVotingPower.toString());
    }
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
