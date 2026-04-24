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
// TODO(multi-dao): load governor ABI from
// daoConfig[daoIdEnum].daoOverview.contracts.governor once we support non-ENS
// DAOs. Today this hook only supports ENS — see the assertion in `publish`.
import ensGovernorAbi from "@/abis/ens-governor.json";
import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import { encodeDescription } from "@/features/create-proposal/utils/encodeDescription";
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import { DaoIdEnum } from "@/shared/types/daos";

const governorAbi = ensGovernorAbi as unknown as Abi;

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
    async (
      form: ProposalFormValues,
      governorAddress: `0x${string}`,
      daoIdEnum: DaoIdEnum,
    ) => {
      setResolveError(null);
      // TODO(multi-dao): remove this guard when we load the governor ABI per
      // DAO. Today the ABI is hardcoded to ENS, so other DAOs would decode
      // logs and call `propose` with the wrong interface.
      if (daoIdEnum !== DaoIdEnum.ENS) {
        setResolveError(
          new Error(
            `Proposal publishing is only supported for ENS at the moment (got ${daoIdEnum}).`,
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

      writeContract({
        address: governorAddress,
        abi: governorAbi,
        functionName: "propose",
        args: [encoded.targets, encoded.values, encoded.calldatas, description],
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
      ? ((
          parseEventLogs({
            abi: governorAbi,
            logs: receipt.logs,
            eventName: "ProposalCreated",
          })[0]?.args as { proposalId?: bigint } | undefined
        )?.proposalId ?? null)
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
