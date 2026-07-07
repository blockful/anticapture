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

// Gnosis Safe Enum.Operation.Call — the only operation the UI emits.
const SAFE_OPERATION_CALL = 0;

// LinearERC20Voting needs no extra submit-time params: Azorius builds the
// strategy init payload internally, so `_data` is empty.
const AZORIUS_EMPTY_STRATEGY_DATA = "0x" as const;

/** DAOs whose proposals go through an Azorius module rather than an OZ Governor. */
export const isAzoriusDao = (daoId: DaoIdEnum) => daoId === DaoIdEnum.SHU;

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

  writeContract({
    address: governorAddress,
    abi: ozProposeAbi,
    functionName: "propose",
    args: [
      encoded.targets,
      encoded.values,
      encoded.calldatas,
      encodeDescription(title, discussionUrl ?? "", body),
    ],
    chainId,
  });
};

/** The `ProposalCreated` event ABI matching the DAO's governance mechanism. */
export const getProposalCreatedEventAbi = (daoId: DaoIdEnum) =>
  isAzoriusDao(daoId)
    ? azoriusProposalCreatedEventAbi
    : ozProposalCreatedEventAbi;
