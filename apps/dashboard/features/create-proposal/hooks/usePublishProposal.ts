"use client";

import { useCallback, useState } from "react";
import { normalize } from "viem/ens";
import { parseEventLogs, type Address } from "viem";
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
import {
  getProposalCreatedEventAbi,
  submitProposalRequest,
} from "@/features/create-proposal/utils/submitProposalRequest";
import { canCreateProposalForDao } from "@/features/create-proposal/constants";
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import type { DaoIdEnum } from "@/shared/types/daos";

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
      const { contracts, chain } =
        daoConfigByDaoId[daoIdEnum]?.daoOverview ?? {};
      const governorAddress = contracts?.governor as Address | undefined;
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

      setTxChainId(chain?.id);
      setTxDaoId(daoIdEnum);

      try {
        submitProposalRequest(writeContract, {
          daoId: daoIdEnum,
          governorAddress,
          votingStrategyAddress: contracts?.votingStrategy as
            | Address
            | undefined,
          encoded,
          title: form.title,
          body: form.body,
          discussionUrl: form.discussionUrl,
          chainId: chain?.id,
        });
      } catch (err) {
        setResolveError(err as Error);
      }
    },
    [writeContract, ensClient],
  );

  const reset = useCallback(() => {
    resetWrite();
    setResolveError(null);
  }, [resetWrite]);

  const proposalId =
    receipt && isReceiptSuccess && txDaoId
      ? (parseEventLogs({
          abi: getProposalCreatedEventAbi(txDaoId),
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
