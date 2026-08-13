import {
  Address,
  encodeFunctionData,
  Hex,
  keccak256,
  toBytes,
  type PublicActions,
} from "viem";

import { createLogger, type Logger } from "@anticapture/observability";

import { governorAbi, ProposalState } from "@/abi/governor";
import { RelayerSigner } from "@/signer/types";

/**
 * Narrow interface covering only the viem actions the keeper uses.
 * A real PublicClient satisfies this via structural subtyping.
 */
export type KeeperChainReader = Pick<
  PublicActions,
  | "getBlockNumber"
  | "getBlock"
  | "getContractEvents"
  | "readContract"
  | "simulateContract"
  | "getBalance"
  | "waitForTransactionReceipt"
>;

/**
 * A proposal the keeper is watching, with everything needed to call
 * queue()/execute(). bigints are stored as decimal strings so the
 * record round-trips through JSON (Redis).
 */
export interface TrackedProposal {
  proposalId: string;
  targets: Address[];
  values: string[];
  calldatas: Hex[];
  descriptionHash: Hex;
  endBlock: string;
}

export interface KeeperStorage {
  getCursor(): Promise<bigint | null>;
  setCursor(block: bigint): Promise<void>;
  putProposal(proposal: TrackedProposal): Promise<void>;
  listProposals(): Promise<TrackedProposal[]>;
  removeProposal(proposalId: string): Promise<void>;
}

export interface KeeperConfig {
  governorAddress: Address;
  /** First block scanned for ProposalCreated when no cursor is stored yet. */
  startBlock: bigint;
  queueDelaySeconds: number;
  executionDelaySeconds: number;
  /** Below this relayer balance the keeper logs and skips broadcasting. */
  minBalanceWei: bigint;
  /** Widest fromBlock..toBlock span per getLogs call; RPC providers cap this. */
  maxBlockRange?: bigint;
}

const DEFAULT_MAX_BLOCK_RANGE = 10_000n;

/**
 * Watches Governor proposals and pays the gas nobody else will:
 * queue() once a proposal succeeds and execute() once its timelock
 * delay passes, each after a configurable grace delay.
 */
export class ProposalLifecycleService {
  constructor(
    private chain: KeeperChainReader,
    private signer: RelayerSigner,
    private storage: KeeperStorage,
    private config: KeeperConfig,
    /** Unix seconds; injectable for tests. */
    private now: () => number = () => Math.floor(Date.now() / 1000),
    private logger: Logger = createLogger("relayer-keeper"),
  ) {}

  async tick(): Promise<void> {
    await this.discoverProposals();
    const tracked = await this.storage.listProposals();
    for (const proposal of tracked) {
      try {
        await this.processProposal(proposal);
      } catch (err) {
        this.logger.error(
          { err, proposalId: proposal.proposalId },
          "keeper: failed to process proposal",
        );
      }
    }
  }

  private async discoverProposals(): Promise<void> {
    const latest = await this.chain.getBlockNumber();
    const cursor = (await this.storage.getCursor()) ?? this.config.startBlock;
    if (latest < cursor) return;

    const maxRange = this.config.maxBlockRange ?? DEFAULT_MAX_BLOCK_RANGE;
    for (let fromBlock = cursor; fromBlock <= latest; fromBlock += maxRange) {
      const toBlock =
        fromBlock + maxRange - 1n < latest ? fromBlock + maxRange - 1n : latest;
      await this.scanRange(fromBlock, toBlock);
      // persist progress per chunk so a long backfill resumes where it stopped
      await this.storage.setCursor(toBlock + 1n);
    }
  }

  private async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const events = await this.chain.getContractEvents({
      address: this.config.governorAddress,
      abi: governorAbi,
      eventName: "ProposalCreated",
      fromBlock,
      toBlock,
    });

    for (const event of events) {
      const args = event.args as {
        proposalId: bigint;
        targets: readonly Address[];
        values: readonly bigint[];
        calldatas: readonly Hex[];
        description: string;
        endBlock: bigint;
      };
      await this.storage.putProposal({
        proposalId: args.proposalId.toString(),
        targets: [...args.targets],
        values: args.values.map((v) => v.toString()),
        calldatas: [...args.calldatas],
        descriptionHash: keccak256(toBytes(args.description)),
        endBlock: args.endBlock.toString(),
      });
    }
  }

  private async processProposal(proposal: TrackedProposal): Promise<void> {
    const state = await this.chain.readContract({
      address: this.config.governorAddress,
      abi: governorAbi,
      functionName: "state",
      args: [BigInt(proposal.proposalId)],
    });

    const terminalStates = [
      ProposalState.Canceled,
      ProposalState.Defeated,
      ProposalState.Expired,
      ProposalState.Executed,
    ];
    if (terminalStates.includes(state)) {
      await this.storage.removeProposal(proposal.proposalId);
      return;
    }

    if (state === ProposalState.Succeeded) {
      const { timestamp: votingEnd } = await this.chain.getBlock({
        blockNumber: BigInt(proposal.endBlock),
      });
      if (
        BigInt(this.now()) >=
        votingEnd + BigInt(this.config.queueDelaySeconds)
      ) {
        await this.broadcast(proposal, "queue");
      }
      return;
    }

    if (state === ProposalState.Queued) {
      const eta = await this.chain.readContract({
        address: this.config.governorAddress,
        abi: governorAbi,
        functionName: "proposalEta",
        args: [BigInt(proposal.proposalId)],
      });
      if (
        BigInt(this.now()) >=
        eta + BigInt(this.config.executionDelaySeconds)
      ) {
        await this.broadcast(proposal, "execute");
      }
    }
  }

  private async broadcast(
    proposal: TrackedProposal,
    functionName: "queue" | "execute",
  ): Promise<void> {
    const relayerAddress = await this.signer.getAddress();

    const balance = await this.chain.getBalance({ address: relayerAddress });
    if (balance < this.config.minBalanceWei) {
      this.logger.error(
        {
          proposalId: proposal.proposalId,
          action: functionName,
          balance: balance.toString(),
          minBalanceWei: this.config.minBalanceWei.toString(),
        },
        "keeper: relayer balance below minimum, skipping broadcast",
      );
      return;
    }

    const args = [
      proposal.targets,
      proposal.values.map(BigInt),
      proposal.calldatas,
      proposal.descriptionHash,
    ] as const;

    await this.chain.simulateContract({
      address: this.config.governorAddress,
      abi: governorAbi,
      functionName,
      args,
      account: relayerAddress,
    });

    const hash = await this.signer.sendTransaction({
      to: this.config.governorAddress,
      data: encodeFunctionData({ abi: governorAbi, functionName, args }),
    });

    await this.chain.waitForTransactionReceipt({ hash });
  }
}
