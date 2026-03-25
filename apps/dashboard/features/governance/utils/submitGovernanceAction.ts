import { keccak256, publicActions, toHex } from "viem";
import type { Address, Chain, WalletClient } from "viem";
import type { DaoIdEnum } from "@/shared/types/daos";
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

export type GovernanceAction = "queue" | "execute";

type ActionArgs = {
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: `0x${string}`[];
  descriptionHash: `0x${string}`;
  account: Address;
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

  const contractArgs = [
    args.targets,
    args.values,
    args.calldatas,
    args.descriptionHash,
  ] as const;

  let hash: `0x${string}`;
  if (action === "queue") {
    const { request } = await client.simulateContract({
      abi: GovernorQueueAbi,
      address,
      functionName: "queue",
      args: contractArgs,
      account: args.account,
      chain,
    });
    hash = await client.writeContract(request);
  } else {
    const { request } = await client.simulateContract({
      abi: GovernorExecuteAbi,
      address,
      functionName: "execute",
      args: contractArgs,
      account: args.account,
      value: 0n,
      chain,
    });
    hash = await client.writeContract(request);
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
): ActionArgs => {
  return {
    targets: proposalTargets.map((t) => (t ?? "0x") as `0x${string}`),
    values: proposalValues.map((v) => BigInt(v ?? "0")),
    calldatas: proposalCalldatas.map((c) => (c ?? "0x") as `0x${string}`),
    descriptionHash: keccak256(toHex(description)),
    account,
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
    ),
    onTxHash,
  );
