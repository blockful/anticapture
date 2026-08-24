import { type Abi, type Address, type Hex } from "viem";
import { type useWriteContract } from "wagmi";

import { encodeDescription } from "@/features/create-proposal/utils/encodeDescription";
import { DaoIdEnum } from "@/shared/types/daos";

type WriteContractFn = ReturnType<typeof useWriteContract>["writeContract"];

// OZ Governor: propose(targets, values, calldatas, description).
const ozProposeAbi = [
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

const ozProposalCreatedEventAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: false, name: "proposalId", type: "uint256" },
      { indexed: false, name: "proposer", type: "address" },
      { indexed: false, name: "targets", type: "address[]" },
      { indexed: false, name: "values", type: "uint256[]" },
      { indexed: false, name: "signatures", type: "string[]" },
      { indexed: false, name: "calldatas", type: "bytes[]" },
      { indexed: false, name: "startBlock", type: "uint256" },
      { indexed: false, name: "endBlock", type: "uint256" },
      { indexed: false, name: "description", type: "string" },
    ],
  },
] as const satisfies Abi;

// Shutter uses the Fractal/Azorius framework instead of an OZ Governor: proposals
// are submitted to the Azorius module via submitProposal, with the actions passed
// as Transaction tuples and the title/body carried in a JSON metadata string
// (parsed back out by the indexer).
const azoriusSubmitProposalAbi = [
  {
    type: "function",
    name: "submitProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_strategy", type: "address" },
      { name: "_data", type: "bytes" },
      {
        name: "_transactions",
        type: "tuple[]",
        components: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "operation", type: "uint8" },
        ],
      },
      { name: "_metadata", type: "string" },
    ],
    outputs: [],
  },
] as const satisfies Abi;

const azoriusProposalCreatedEventAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: false, name: "strategy", type: "address" },
      { indexed: false, name: "proposalId", type: "uint256" },
      { indexed: false, name: "proposer", type: "address" },
      {
        indexed: false,
        name: "transactions",
        type: "tuple[]",
        components: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "operation", type: "uint8" },
        ],
      },
      { indexed: false, name: "metadata", type: "string" },
    ],
  },
] as const satisfies Abi;

// Tornado Cash governance: proposals are pre-deployed contracts that the
// governance contract delegatecalls on execution, so propose takes a single
// target address and a description instead of action arrays.
const tornProposeAbi = [
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "address" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

/**
 * Selector of executeProposal(), the function Tornado governance delegatecalls
 * on the proposal contract when a passed proposal is executed. A TORN draft is
 * only publishable when its single action is exactly this call, so what the
 * DAO reviews matches what execution will do.
 */
export const TORN_EXECUTE_PROPOSAL_CALLDATA = "0x373058b8";

const tornProposalCreatedEventAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: true, name: "proposalId", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      { indexed: false, name: "target", type: "address" },
      { indexed: false, name: "startTime", type: "uint256" },
      { indexed: false, name: "endTime", type: "uint256" },
      { indexed: false, name: "description", type: "string" },
    ],
  },
] as const satisfies Abi;

// Gnosis Safe Enum.Operation.Call — the only operation the UI emits.
const SAFE_OPERATION_CALL = 0;

// LinearERC20Voting needs no extra submit-time params: Azorius builds the
// strategy init payload internally, so `_data` is empty.
const AZORIUS_EMPTY_STRATEGY_DATA = "0x" as const;

/** DAOs whose proposals go through an Azorius module rather than an OZ Governor. */
// SHU, the only Azorius DAO, is disabled in DaoIdEnum.
export const isAzoriusDao = (_daoId: DaoIdEnum) => false;

/** DAOs on Tornado Cash's custom stake-to-vote governance. */
export const isTornadoDao = (daoId: DaoIdEnum) => daoId === DaoIdEnum.TORN;

export interface EncodedActions {
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
}

interface SubmitProposalParams {
  daoId: DaoIdEnum;
  governorAddress: Address;
  votingStrategyAddress?: Address;
  encoded: EncodedActions;
  title: string;
  body: string;
  discussionUrl?: string;
  chainId?: number;
}

const buildAzoriusMetadata = ({
  title,
  body,
  discussionUrl,
}: Pick<SubmitProposalParams, "title" | "body" | "discussionUrl">) => {
  const trimmedUrl = discussionUrl?.trim();
  return JSON.stringify({
    title,
    description: trimmedUrl ? `${trimmedUrl}\n\n${body}` : body,
  });
};

/**
 * Submits a proposal-creation transaction, choosing the OZ Governor or Azorius
 * path from the DAO's governance mechanism. Keeps the mechanism-specific ABIs and
 * encoding out of the calling hook (cf. `voteOnProposal` and
 * `submitGovernanceAction`). Throws if required config is missing.
 */
export const submitProposalRequest = (
  writeContract: WriteContractFn,
  {
    daoId,
    governorAddress,
    votingStrategyAddress,
    encoded,
    title,
    body,
    discussionUrl,
    chainId,
  }: SubmitProposalParams,
) => {
  if (isAzoriusDao(daoId)) {
    if (!votingStrategyAddress) {
      throw new Error(
        `No voting strategy configured for ${daoId}. Add one to dao-config to enable publishing.`,
      );
    }

    const transactions = encoded.targets.map((to, index) => ({
      to,
      value: encoded.values[index] ?? 0n,
      data: encoded.calldatas[index] ?? AZORIUS_EMPTY_STRATEGY_DATA,
      operation: SAFE_OPERATION_CALL,
    }));

    writeContract({
      address: governorAddress,
      abi: azoriusSubmitProposalAbi,
      functionName: "submitProposal",
      args: [
        votingStrategyAddress,
        AZORIUS_EMPTY_STRATEGY_DATA,
        transactions,
        buildAzoriusMetadata({ title, body, discussionUrl }),
      ],
      chainId,
    });
    return;
  }

  const description = encodeDescription(title, discussionUrl ?? "", body);

  if (isTornadoDao(daoId)) {
    // The single action's contract address is the pre-deployed proposal
    // contract the governance will delegatecall on execution, which always
    // calls the target's executeProposal(). Any other action (a transfer, a
    // different function) would create a proposal whose execution silently
    // does something else or reverts, so it is rejected before the wallet.
    if (
      encoded.targets.length !== 1 ||
      encoded.calldatas[0]?.toLowerCase() !== TORN_EXECUTE_PROPOSAL_CALLDATA
    ) {
      throw new Error(
        "Tornado Cash proposals delegatecall a single pre-deployed proposal contract; add exactly one custom action calling executeProposal() on it.",
      );
    }
    if ((encoded.values[0] ?? 0n) !== 0n) {
      throw new Error("Tornado Cash proposals cannot send ETH.");
    }

    writeContract({
      address: governorAddress,
      abi: tornProposeAbi,
      functionName: "propose",
      args: [encoded.targets[0], description],
      chainId,
    });
    return;
  }

  writeContract({
    address: governorAddress,
    abi: ozProposeAbi,
    functionName: "propose",
    args: [encoded.targets, encoded.values, encoded.calldatas, description],
    chainId,
  });
};

/** The `ProposalCreated` event ABI matching the DAO's governance mechanism. */
export const getProposalCreatedEventAbi = (daoId: DaoIdEnum) => {
  if (isAzoriusDao(daoId)) return azoriusProposalCreatedEventAbi;
  if (isTornadoDao(daoId)) return tornProposalCreatedEventAbi;
  return ozProposalCreatedEventAbi;
};
