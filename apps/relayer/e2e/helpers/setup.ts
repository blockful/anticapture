import {
  type Address,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEventLogs,
} from "viem";
import { mainnet } from "viem/chains";

import { governorAbi, ProposalState } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";

import { createClients } from "./anvil";
import {
  DEAD_ADDRESS,
  GOVERNOR_ADDRESS,
  TOKEN_ADDRESS,
  WHALE_ADDRESS,
} from "./constants";

type TestClient = ReturnType<typeof createClients>["testClient"];

export async function fundFromWhale(
  testClient: TestClient,
  rpcUrl: string,
  recipient: Address,
  amount: bigint,
): Promise<void> {
  await testClient.impersonateAccount({ address: WHALE_ADDRESS });
  const whale = createWalletClient({
    account: WHALE_ADDRESS,
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await whale.sendTransaction({
    to: TOKEN_ADDRESS,
    data: encodeFunctionData({
      abi: erc20VotesAbi,
      functionName: "transfer",
      args: [recipient, amount],
    }),
  });
  await testClient.waitForTransactionReceipt({ hash });
  await testClient.mine({ blocks: 1 });
}

/**
 * Self-delegates from an anvil dev account (unlocked by default, so we can use
 * `json-rpc` account type without private keys).
 */
export async function selfDelegate(
  testClient: TestClient,
  rpcUrl: string,
  account: Address,
): Promise<void> {
  const wallet = createWalletClient({
    account: { address: account, type: "json-rpc" },
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await wallet.writeContract({
    address: TOKEN_ADDRESS,
    abi: erc20VotesAbi,
    functionName: "delegate",
    args: [account],
  });
  await testClient.waitForTransactionReceipt({ hash });
  await testClient.mine({ blocks: 1 });
}

/** Submits a no-op proposal (zero-value transfer to 0xdead) and returns the proposalId. */
export async function createNoOpProposal(
  testClient: TestClient,
  rpcUrl: string,
  proposer: Address,
): Promise<bigint> {
  const wallet = createWalletClient({
    account: { address: proposer, type: "json-rpc" },
    transport: http(rpcUrl),
    chain: mainnet,
  });
  const hash = await wallet.writeContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: "propose",
    args: [
      [TOKEN_ADDRESS],
      [0n],
      [
        encodeFunctionData({
          abi: erc20VotesAbi,
          functionName: "transfer",
          args: [DEAD_ADDRESS, 0n],
        }),
      ],
      "e2e relay-vote test proposal",
    ],
  });
  const receipt = await testClient.waitForTransactionReceipt({ hash });
  const [proposalCreated] = parseEventLogs({
    abi: governorAbi,
    eventName: "ProposalCreated",
    logs: receipt.logs,
  });
  if (!proposalCreated) {
    throw new Error("ProposalCreated event not found in propose() receipt");
  }
  return proposalCreated.args.proposalId;
}

/**
 * Mines past `votingDelay` so the proposal becomes Active, then asserts the
 * state machine is where we expect. Returns `votingPeriod` so callers can roll
 * past the deadline when needed.
 */
export async function activateProposal(
  testClient: TestClient,
  proposalId: bigint,
): Promise<{ votingPeriod: bigint }> {
  const [votingDelay, votingPeriod] = await Promise.all([
    testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "votingDelay",
    }),
    testClient.readContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: "votingPeriod",
    }),
  ]);
  await testClient.mine({ blocks: Number(votingDelay) + 1 });

  const state = await testClient.readContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: "state",
    args: [proposalId],
  });
  if (state !== ProposalState.Active) {
    throw new Error(
      `Expected proposal to be Active, got state=${state} (proposalId=${proposalId})`,
    );
  }

  return { votingPeriod };
}
