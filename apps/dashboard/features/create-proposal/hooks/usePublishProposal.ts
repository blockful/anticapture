"use client";

import { useCallback, useState } from "react";
import { normalize } from "viem/ens";
import { parseEventLogs, type Abi } from "viem";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { mainnet } from "wagmi/chains";

import daoConfigByDaoId from "@/shared/dao-config";
import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import { encodeDescription } from "@/features/create-proposal/utils/encodeDescription";
import { canCreateProposalForDao } from "@/features/create-proposal/constants";
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import { DaoIdEnum } from "@/shared/types/daos";

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

const proposalCreatedEventAbi = [
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

// Shutter DAO uses the Fractal/Azorius framework instead of an OZ Governor.
// Proposals are submitted to the Azorius module via `submitProposal`, with the
// governance actions passed as Transaction tuples and the title/description
// carried in a JSON metadata string (parsed back out by the indexer).
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

// Gnosis Safe Enum.Operation.Call — the only operation we emit from the UI.
const SAFE_OPERATION_CALL = 0;

const isAzoriusDao = (daoId: DaoIdEnum) => daoId === DaoIdEnum.SHU;

export const usePublishProposal = () => {
  const [resolveError, setResolveError] = useState<Error | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [txChainId, setTxChainId] = useState<number | undefined>();
  const [txDaoId, setTxDaoId] = useState<DaoIdEnum | undefined>();

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isReceiptLoading,
    isSuccess: isReceiptMined,
    isError: isReceiptFetchError,
  } = useWaitForTransactionReceipt({ hash: txHash, chainId: txChainId });

  const isReceiptSuccess = isReceiptMined && receipt?.status === "success";
  const isReceiptError =
    isReceiptFetchError || (isReceiptMined && receipt?.status === "reverted");

  const ensClient = usePublicClient({ chainId: mainnet.id });

  const publish = useCallback(
    async (form: ProposalFormValues, daoIdEnum: DaoIdEnum) => {
      setResolveError(null);

      if (!canCreateProposalForDao(daoIdEnum)) {
        setResolveError(
          new Error(`Publishing for ${daoIdEnum} isn't supported yet.`),
        );
        return;
      }
      const governorAddress = daoConfigByDaoId[daoIdEnum]?.daoOverview
        ?.contracts?.governor as `0x${string}` | undefined;
      if (!governorAddress) {
        setResolveError(
          new Error(
            `No governor address configured for ${daoIdEnum}. Add one to dao-config to enable publishing.`,
          ),
        );
        return;
      }

      if (!ensClient) {
        setResolveError(new Error("No public client available"));
        return;
      }

      const resolver = makeAddressResolver(async (name) =>
        ensClient.getEnsAddress({ name: normalize(name) }),
      );

      setIsResolving(true);
      let encoded;
      try {
        encoded = await encodeActions(form.actions, resolver);
      } catch (err) {
        setResolveError(err as Error);
        return;
      } finally {
        setIsResolving(false);
      }

      const description = encodeDescription(
        form.title,
        form.discussionUrl ?? "",
        form.body,
      );

      const chainId = daoConfigByDaoId[daoIdEnum]?.daoOverview?.chain?.id;
      setTxChainId(chainId);
      setTxDaoId(daoIdEnum);

      // Shutter (Azorius): same user inputs, different contract call. We map the
      // encoded actions onto Azorius Transaction tuples and carry the
      // title/body as JSON metadata, then call `submitProposal` on the Azorius
      // module (the configured `governor`) with its voting strategy.
      if (isAzoriusDao(daoIdEnum)) {
        const strategyAddress = daoConfigByDaoId[daoIdEnum]?.daoOverview
          ?.contracts?.votingStrategy as `0x${string}` | undefined;
        if (!strategyAddress) {
          setResolveError(
            new Error(
              `No voting strategy configured for ${daoIdEnum}. Add one to dao-config to enable publishing.`,
            ),
          );
          return;
        }

        const transactions = encoded.targets.map((to, index) => ({
          to,
          value: encoded.values[index] ?? 0n,
          data: encoded.calldatas[index] ?? ("0x" as const),
          operation: SAFE_OPERATION_CALL,
        }));

        const metadata = JSON.stringify({
          title: form.title,
          description: form.discussionUrl?.trim()
            ? `${form.discussionUrl.trim()}\n\n${form.body}`
            : form.body,
        });

        writeContract({
          address: governorAddress,
          abi: azoriusSubmitProposalAbi,
          functionName: "submitProposal",
          // _data is empty: LinearERC20Voting needs no extra submit-time params
          // (Azorius builds the strategy init payload internally).
          args: [strategyAddress, "0x", transactions, metadata],
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
    },
    [writeContract, ensClient],
  );

  const reset = useCallback(() => {
    resetWrite();
    setResolveError(null);
  }, [resetWrite]);

  const proposalId =
    receipt && isReceiptSuccess
      ? (parseEventLogs({
          abi:
            txDaoId && isAzoriusDao(txDaoId)
              ? azoriusProposalCreatedEventAbi
              : proposalCreatedEventAbi,
          logs: receipt.logs,
          eventName: "ProposalCreated",
        })[0]?.args.proposalId ?? null)
      : null;

  const revertError =
    isReceiptMined && receipt?.status === "reverted"
      ? new Error("Transaction reverted on-chain.")
      : null;

  return {
    publish,
    reset,
    txHash,
    isWritePending: isWritePending || isResolving,
    isWriteError: isWriteError || resolveError !== null,
    writeError: writeError ?? resolveError ?? revertError,
    isReceiptLoading,
    isReceiptSuccess,
    isReceiptError,
    proposalId,
  };
};
