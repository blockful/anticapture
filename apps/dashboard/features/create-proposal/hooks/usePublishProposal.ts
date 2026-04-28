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
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import { DaoIdEnum } from "@/shared/types/daos";

// Typed-const ABI fragments for the two `propose` shapes we know how to build
// today. Keeping them inline (instead of importing the full governor JSON)
// lets viem infer arg/return types from literals — no `as unknown as Abi`
// casts at call sites.

// OZ Governor (ENS, OP, GTC, FLUID, OBOL, SCR, …)
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

// `ProposalCreated` event used by both OZ Governor and Governor Bravo. The
// `signatures` field is present on both (OZ emits an empty array). Inlining as
// a typed const lets viem infer `args.proposalId: bigint` from literals.
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

// Governor variant tags drive the ABI + arg shape used by `propose`. Mirrors
// the per-DAO switch in `submitGovernanceAction.ts` so the two stay in sync.
type GovernorVariant = "oz" | "bravo" | "azorius";

const governorVariantByDao: Partial<Record<DaoIdEnum, GovernorVariant>> = {
  [DaoIdEnum.ENS]: "oz",
  [DaoIdEnum.UNISWAP]: "bravo",
  [DaoIdEnum.NOUNS]: "bravo",
  [DaoIdEnum.LIL_NOUNS]: "bravo",
  [DaoIdEnum.COMP]: "bravo",
  [DaoIdEnum.SHU]: "azorius",
  // OZ Governor variants for the rest. AAVE is intentionally absent — its
  // dao-config has no `governor` address, so publish() can't be wired up
  // without first sourcing one.
};

export const usePublishProposal = () => {
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
  } = useWaitForTransactionReceipt({ hash: txHash });

  // `isSuccess` from wagmi only means the receipt was retrieved, not that the
  // tx succeeded on-chain. A reverted tx has status === "reverted" but still
  // resolves the receipt. Gate success explicitly on receipt.status.
  const isReceiptSuccess = isReceiptMined && receipt?.status === "success";
  const isReceiptError =
    isReceiptFetchError || (isReceiptMined && receipt?.status === "reverted");

  const [resolveError, setResolveError] = useState<Error | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // ENS resolution always happens against mainnet regardless of the governance
  // chain. For multi-chain DAOs this is correct for ENS names but means raw
  // addresses are used as-is on the governance chain.
  const ensClient = usePublicClient({ chainId: mainnet.id });

  const publish = useCallback(
    async (form: ProposalFormValues, daoIdEnum: DaoIdEnum) => {
      setResolveError(null);

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

      const variant = governorVariantByDao[daoIdEnum];
      if (variant === "bravo") {
        // Bravo publish is not enabled yet — the encoder produces 4-arg OZ
        // calldata, and there's no UI for the per-action `signatures` slot.
        // Wire this up once the multi-DAO encoder lands.
        setResolveError(
          new Error(
            `Publishing for ${daoIdEnum} (Governor Bravo) isn't supported yet.`,
          ),
        );
        return;
      }
      if (variant === "azorius") {
        setResolveError(
          new Error(
            `Publishing for ${daoIdEnum} (Azorius) isn't supported — proposals go through a separate strategy contract.`,
          ),
        );
        return;
      }
      if (variant !== "oz") {
        setResolveError(
          new Error(`Publishing for ${daoIdEnum} isn't supported yet.`),
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
          abi: proposalCreatedEventAbi,
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
