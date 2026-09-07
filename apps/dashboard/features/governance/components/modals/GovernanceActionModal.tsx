"use client";

import { proposalQueryKey, proposalsQueryKey } from "@anticapture/client/hooks";
import type { ProposalPathParamsDaoEnumKey } from "@anticapture/client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Hourglass, PenLine, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address, Hash } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import type { ProposalViewData } from "@/features/governance/types";
import {
  canRelayGovernanceAction,
  getRelayBlockedReason,
  relayGovernanceAction,
} from "@/features/governance/utils/relayGovernanceAction";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import {
  executeProposal,
  queueProposal,
  type GovernanceAction,
} from "@/features/governance/utils/submitGovernanceAction";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import daoConfigByDaoId from "@/shared/dao-config";
import { useGaslessEnactment } from "@/shared/hooks/useGaslessRelayer";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { mapRelayerEnactmentError } from "@/shared/utils/gaslessRelayerError";

/**
 * "idle" lasts only while the relayer balance query settles. "choose" is
 * reached when the relayer can sponsor the action: the user picks between the
 * free path and their own wallet. Without a relayer the modal opens straight
 * into the wallet flow, as it always did. "unconfirmed" means the transaction
 * was broadcast but the receipt could not be checked, so it is neither a
 * success nor a failure yet.
 */
type ActionStep =
  | "idle"
  | "choose"
  | "waiting-signature"
  | "relaying"
  | "pending-tx"
  | "success"
  | "unconfirmed"
  | "error";

type ActionMode = "wallet" | "gasless";

interface GovernanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: GovernanceAction;
  proposal: ProposalViewData;
  daoId: DaoIdEnum;
}

const ACTION_COPY: Record<
  GovernanceAction,
  {
    title: string;
    verb: string;
    pastTense: string;
    walletStep: string;
    relayStep: string;
  }
> = {
  queue: {
    title: "Confirm Queue",
    verb: "Queue",
    pastTense: "queued",
    walletStep: "Confirm queuing in your wallet",
    relayStep: "Relayer submits the queue transaction (free)",
  },
  execute: {
    title: "Confirm Execution",
    verb: "Execute",
    pastTense: "executed",
    walletStep: "Confirm execution in your wallet",
    relayStep: "Relayer submits the execute transaction (free)",
  },
};

const REVERTED_MESSAGE =
  "The transaction was mined but reverted on-chain. The proposal state did not change.";

const shortenHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

export const GovernanceActionModal = ({
  isOpen,
  onClose,
  action,
  proposal,
  daoId,
}: GovernanceActionModalProps) => {
  const [step, setStep] = useState<ActionStep>("idle");
  const [mode, setMode] = useState<ActionMode>("wallet");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  // One submission at a time: a second click while a wallet prompt or relayer
  // call is pending must not broadcast twice.
  const inFlightRef = useRef(false);

  const { address } = useAccount();
  const chain = daoConfigByDaoId[daoId].daoOverview.chain;
  const { data: walletClient } = useWalletClient({ chainId: chain.id });
  const publicClient = usePublicClient({ chainId: chain.id });
  const queryClient = useQueryClient();

  const { isAvailable: isGaslessAvailable, isLoading: isGaslessLoading } =
    useGaslessEnactment(daoId);
  const relayBlockedReason = getRelayBlockedReason(action, proposal.status);
  const canRelay =
    isGaslessAvailable && canRelayGovernanceAction(action, proposal.status);

  const copy = ACTION_COPY[action];
  const explorerBaseUrl = chain.blockExplorers?.default?.url;

  const refreshProposal = useCallback(() => {
    const daoKey = daoId.toLowerCase() as ProposalPathParamsDaoEnumKey;
    void queryClient.invalidateQueries({
      queryKey: proposalQueryKey(daoKey, proposal.id),
    });
    void queryClient.invalidateQueries({
      queryKey: proposalsQueryKey(daoKey),
    });
  }, [queryClient, daoId, proposal.id]);

  const handleSuccess = useCallback(() => {
    setStep("success");
    showCustomToast(`Proposal ${copy.pastTense} successfully!`, "success");
    refreshProposal();
  }, [copy.pastTense, refreshProposal]);

  const handleFailure = useCallback((message: string) => {
    setError(message);
    setStep("error");
  }, []);

  const runWalletAction = useCallback(async () => {
    if (!address || !walletClient || inFlightRef.current) return;
    inFlightRef.current = true;

    setMode("wallet");
    setError(null);
    setTxHash(null);
    setStep("waiting-signature");

    try {
      const handler = action === "queue" ? queueProposal : executeProposal;
      const targets = proposal.targets ?? [];
      const values = proposal.values ?? [];
      const calldatas = proposal.calldatas ?? [];
      const validIndices = targets.reduce<number[]>((acc, t, i) => {
        if (
          t !== null &&
          values[i] !== null &&
          (calldatas[i] ?? null) !== null
        ) {
          acc.push(i);
        }
        return acc;
      }, []);
      const receipt = await handler(
        validIndices.map((i) => targets[i] as Address),
        validIndices.map((i) => values[i] as string),
        validIndices.map((i) => calldatas[i] as Address),
        proposal.description ?? "",
        address,
        daoId,
        walletClient,
        () => setStep("pending-tx"),
        proposal.id,
      );
      setTxHash(receipt.transactionHash);
      if (receipt.status === "reverted") {
        handleFailure(REVERTED_MESSAGE);
      } else {
        handleSuccess();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? (err.message.split("\n")[0]?.slice(0, 120) ?? "Action failed.")
          : "Action failed.";
      handleFailure(message);
    } finally {
      inFlightRef.current = false;
    }
  }, [
    address,
    walletClient,
    action,
    proposal,
    daoId,
    handleSuccess,
    handleFailure,
  ]);

  const runGaslessAction = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setMode("gasless");
    setError(null);
    setTxHash(null);
    setStep("relaying");

    try {
      const outcome = await relayGovernanceAction({
        action,
        daoId,
        proposalId: proposal.id,
        publicClient,
        onTxSubmitted: (hash) => {
          setTxHash(hash);
          setStep("pending-tx");
        },
      });
      if (outcome.status === "success") {
        handleSuccess();
      } else if (outcome.status === "reverted") {
        handleFailure(REVERTED_MESSAGE);
      } else {
        // Broadcast but not confirmed here: never offer a retry, since a
        // second submission would burn relayer gas on a revert.
        setStep("unconfirmed");
        refreshProposal();
      }
    } catch (err) {
      console.error(err);
      handleFailure(mapRelayerEnactmentError(err, action));
    } finally {
      inFlightRef.current = false;
    }
  }, [
    action,
    daoId,
    proposal.id,
    publicClient,
    handleSuccess,
    handleFailure,
    refreshProposal,
  ]);

  // Opening decides the entry point once: with a funded relayer the user gets
  // to choose, otherwise the wallet flow starts on its own as before. While
  // the balance query settles the modal shows a neutral loading state instead
  // of a wallet prompt that is not actually in flight.
  useEffect(() => {
    if (!isOpen) {
      setHasStarted(false);
      return;
    }
    if (hasStarted || isGaslessLoading) return;
    setHasStarted(true);

    if (isGaslessAvailable) {
      setStep("choose");
      return;
    }
    if (!walletClient) {
      handleFailure(`Please switch your wallet to the ${chain.name} network.`);
      return;
    }
    void runWalletAction();
  }, [
    isOpen,
    hasStarted,
    isGaslessLoading,
    isGaslessAvailable,
    walletClient,
    chain.name,
    runWalletAction,
    handleFailure,
  ]);

  const handleUseWallet = () => {
    if (!walletClient) {
      setMode("wallet");
      handleFailure(`Please switch your wallet to the ${chain.name} network.`);
      return;
    }
    void runWalletAction();
  };

  const handleClose = () => {
    if (step === "success" || step === "unconfirmed") refreshProposal();
    setStep("idle");
    setMode("wallet");
    setError(null);
    setTxHash(null);
    setHasStarted(false);
    onClose();
  };

  const isGaslessRun = mode === "gasless";

  const txHashRow = txHash && (
    <div className="flex items-start gap-2">
      <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
        Transaction
      </span>
      {explorerBaseUrl ? (
        <a
          href={`${explorerBaseUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link inline-flex items-center gap-1 break-all text-sm leading-5 hover:underline"
        >
          {shortenHash(txHash)}
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      ) : (
        <span className="text-primary break-all text-sm leading-5">
          {txHash}
        </span>
      )}
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={copy.title}
    >
      {/* Proposal info */}
      <div className="flex flex-col gap-2 pb-4">
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Proposal ID
          </span>
          <span className="text-primary break-all text-sm leading-5">
            {proposal.id}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Proposal name
          </span>
          <span className="text-primary text-sm leading-5">
            {proposal.title}
          </span>
        </div>
      </div>

      {step === "idle" ? (
        <div className="text-secondary flex items-center gap-2 py-2 text-sm">
          <SpinIcon className="text-warning size-4 animate-spin" />
          Checking whether this action can be sponsored...
        </div>
      ) : step === "choose" ? (
        <div className="flex flex-col gap-4">
          {canRelay ? (
            <InlineAlert
              variant="success"
              text={`This ${action} is free. The relayer pays the gas, so no wallet transaction is needed.`}
            />
          ) : (
            <InlineAlert
              variant="warning"
              text={
                relayBlockedReason ??
                `The relayer can't ${action} this proposal right now.`
              }
            />
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleUseWallet}>
              Use my wallet
            </Button>
            <Button
              disabled={!canRelay}
              onClick={() => void runGaslessAction()}
              data-ph-event={`proposal_${action}_gasless`}
              data-ph-source="gov_fe"
            >
              <Zap className="size-3.5" />
              {copy.verb} for free
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Stepper */}
          <div className="border-border-default flex flex-col gap-1.5 border p-3">
            <StepRow
              done={
                step === "success" ||
                step === "unconfirmed" ||
                step === "pending-tx"
              }
              active={step === "waiting-signature" || step === "relaying"}
              icon={
                isGaslessRun ? (
                  <Zap className="text-primary size-3.5" />
                ) : (
                  <PenLine className="text-primary size-3.5" />
                )
              }
              label={isGaslessRun ? copy.relayStep : copy.walletStep}
              error={step === "error" ? error : undefined}
            />

            <DividerDefault isVertical className="ml-3.5 h-6 w-0.5" />

            <StepRow
              done={step === "success"}
              active={step === "pending-tx"}
              icon={<Hourglass className="text-primary size-3.5" />}
              label="Wait for transaction to complete"
            />
          </div>

          {txHashRow}

          {step === "unconfirmed" && (
            <InlineAlert
              variant="warning"
              text="The transaction was submitted but could not be confirmed here yet. Check it on the explorer before trying again."
            />
          )}

          {step === "error" && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {isGaslessRun ? (
                <Button onClick={handleUseWallet}>Try with my wallet</Button>
              ) : (
                <>
                  {canRelay && (
                    <Button
                      variant="outline"
                      onClick={() => void runGaslessAction()}
                    >
                      <Zap className="size-3.5" />
                      Try for free
                    </Button>
                  )}
                  <Button onClick={handleUseWallet}>Try again</Button>
                </>
              )}
            </div>
          )}

          {(step === "success" || step === "unconfirmed") && (
            <div className="flex items-center justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

interface StepRowProps {
  done: boolean;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  error?: string | null;
}

const StepRow = ({ done, active, icon, label, error }: StepRowProps) => {
  const getBackgroundColor = () => {
    if (done) return "bg-surface-opacity-success";
    if (active) return "bg-primary";
    return "bg-border-default";
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          {active && (
            <SpinIcon className="text-warning absolute inset-0 size-8 animate-spin" />
          )}
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full",
              getBackgroundColor(),
            )}
          >
            <div className="border-border-default flex items-center justify-center rounded-full border p-1">
              {done ? <Check className="text-success size-3.5" /> : icon}
            </div>
          </div>
        </div>
        <p className="text-primary text-sm leading-5">{label}</p>
      </div>

      {error && (
        <p className="text-error ml-11 break-words text-xs leading-4">
          {error}
        </p>
      )}
    </div>
  );
};
