import { keccak256, publicActions, toHex } from "viem";
import type { Address, Chain, WalletClient } from "viem";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";

const GovernorQueueAbi = [
  {
    name: "queue",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "descriptionHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

const GovernorExecuteAbi = [
  {
    name: "execute",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "descriptionHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

const AzoriusExecuteAbi = [
  {
    name: "executeProposal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint32", name: "_proposalId", type: "uint32" },
      { internalType: "address[]", name: "_targets", type: "address[]" },
      { internalType: "uint256[]", name: "_values", type: "uint256[]" },
      { internalType: "bytes[]", name: "_data", type: "bytes[]" },
      {
        internalType: "enum Enum.Operation[]",
        name: "_operations",
        type: "uint8[]",
      },
    ],
    outputs: [],
  },
] as const;

export type GovernanceAction = "queue" | "execute";

type ActionArgs = {
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: `0x${string}`[];
  descriptionHash: `0x${string}`;
  account: Address;
  proposalId: string;
};

const submitAction = async (
  action: GovernanceAction,
  daoId: DaoIdEnum,
  walletClient: WalletClient,
  args: ActionArgs,
  onTxHash: (hash: `0x${string}`) => void,
) => {
  const client = walletClient.extend(publicActions);
  const daoOverview = daoConfigByDaoId[daoId].daoOverview;
  const address = daoOverview.contracts.governor;
  if (!address) throw new Error("DAO governance address not found");
  const chain = daoOverview.chain as Chain;

  const ozContractArgs = [
    args.targets,
    args.values,
    args.calldatas,
    args.descriptionHash,
  ] as const;

  let hash: `0x${string}`;

  switch (daoId) {
    case DaoIdEnum.SHU: {
      if (action === "queue") {
        throw new Error("Queue is not supported for Azorius governance (SHU)");
      }
      // Azorius: executeProposal(proposalId, targets, values, data, operations)
      // All operations are Call (0) for standard governance proposals
      const operations = args.targets.map(() => 0);
      const { request } = await client.simulateContract({
        abi: AzoriusExecuteAbi,
        address,
        functionName: "executeProposal",
        args: [
          Number(args.proposalId),
          args.targets,
          args.values,
          args.calldatas,
          operations,
        ],
        account: args.account,
        chain,
      });
      hash = await client.writeContract(request);
      break;
    }
    default: {
      if (action === "queue") {
        const { request } = await client.simulateContract({
          abi: GovernorQueueAbi,
          address,
          functionName: "queue",
          args: ozContractArgs,
          account: args.account,
          chain,
        });
        hash = await client.writeContract(request);
      } else {
        const { request } = await client.simulateContract({
          abi: GovernorExecuteAbi,
          address,
          functionName: "execute",
          args: ozContractArgs,
          account: args.account,
          value: 0n,
          chain,
        });
        hash = await client.writeContract(request);
      }
      break;
    }
  }

  onTxHash(hash);
  const receipt = await client.waitForTransactionReceipt({ hash });
  return receipt;
};

const toActionArgs = (
  proposalTargets: (string | null)[],
  proposalValues: (string | null)[],
  proposalCalldatas: (string | null)[],
  description: string,
  account: Address,
  proposalId: string,
): ActionArgs => {
  return {
    targets: proposalTargets.map((t) => (t ?? "0x") as `0x${string}`),
    values: proposalValues.map((v) => BigInt(v ?? "0")),
    calldatas: proposalCalldatas.map((c) => (c ?? "0x") as `0x${string}`),
    descriptionHash: keccak256(toHex(description)),
    account,
    proposalId,
  };
};

export const queueProposal = (
  proposalTargets: (string | null)[],
  proposalValues: (string | null)[],
  proposalCalldatas: (string | null)[],
  description: string,
  account: Address,
  daoId: DaoIdEnum,
  walletClient: WalletClient,
  onTxHash: (hash: `0x${string}`) => void,
  proposalId: string,
) =>
  submitAction(
    "queue",
    daoId,
    walletClient,
    toActionArgs(
      proposalTargets,
      proposalValues,
      proposalCalldatas,
      description,
      account,
      proposalId,
    ),
    onTxHash,
  );

export const executeProposal = (
  proposalTargets: (string | null)[],
  proposalValues: (string | null)[],
  proposalCalldatas: (string | null)[],
  description: string,
  account: Address,
  daoId: DaoIdEnum,
  walletClient: WalletClient,
  onTxHash: (hash: `0x${string}`) => void,
  proposalId: string,
) =>
  submitAction(
    "execute",
    daoId,
    walletClient,
    toActionArgs(
      proposalTargets,
      proposalValues,
      proposalCalldatas,
      description,
      account,
      proposalId,
    ),
    onTxHash,
  );
