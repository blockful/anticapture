"use client";

import { Check, Hourglass, PenLine } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import type { ProposalViewData } from "@/features/governance/types";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import {
  executeProposal,
  queueProposal,
  type GovernanceAction,
} from "@/features/governance/utils/submitGovernanceAction";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { cn } from "@/shared/utils/cn";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type ActionStep = "waiting-signature" | "pending-tx" | "success" | "error";

interface GovernanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: GovernanceAction;
  proposal: ProposalViewData;
  daoId: DaoIdEnum;
}

export const GovernanceActionModal = ({
  isOpen,
  onClose,
  action,
  proposal,
  daoId,
}: GovernanceActionModalProps) => {
  const [step, setStep] = useState<ActionStep>("waiting-signature");
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const chain = daoConfigByDaoId[daoId].daoOverview.chain;
  const { data: walletClient } = useWalletClient({ chainId: chain.id });

  const title = action === "queue" ? "Confirm Queue" : "Confirm Execution";
  const confirmLabel =
    action === "queue"
      ? "Confirm queuing in your wallet"
      : "Confirm execution in your wallet";

  const handleAction = useCallback(async () => {
    if (!address || !walletClient) return;
    if (step === "pending-tx" || step === "success") return;

    setError(null);
    setStep("waiting-signature");

    try {
      const handler = action === "queue" ? queueProposal : executeProposal;
      const calldatas = proposal.calldatas ?? [];
      const validIndices = proposal.targets.reduce<number[]>((acc, t, i) => {
        if (
          t !== null &&
          proposal.values[i] !== null &&
          (calldatas[i] ?? null) !== null
        ) {
          acc.push(i);
        }
        return acc;
      }, []);
      await handler(
        validIndices.map((i) => proposal.targets[i] as Address),
        validIndices.map((i) => proposal.values[i] as string),
        validIndices.map((i) => calldatas[i] as Address),
        proposal.description,
        address,
        daoId,
        walletClient,
        () => setStep("pending-tx"),
        proposal.id,
      );
      setStep("success");
      showCustomToast(
        action === "queue"
          ? "Proposal queued successfully!"
          : "Proposal executed successfully!",
        "success",
      );
      onClose();
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      const message =
        err instanceof Error
          ? (err.message.split("\n")[0]?.slice(0, 120) ?? "Action failed.")
          : "Action failed.";
      setError(message);
      setStep("error");
    }
  }, [address, walletClient, step, action, proposal, daoId, onClose, chain]);

  useEffect(() => {
    if (!isOpen || step !== "waiting-signature") return;
    if (!walletClient) {
      setError(`Please switch your wallet to the ${chain.name} network.`);
      setStep("error");
      return;
    }
    handleAction();
  }, [isOpen, walletClient, handleAction, step, chain.name]);

  const handleClose = () => {
    setStep("waiting-signature");
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={title}
    >
      {/* Proposal info */}
      <div className="flex flex-col gap-2 pb-4">
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Proposal ID
          </span>
          <span className="text-primary text-sm leading-5">{proposal.id}</span>
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

      {/* Stepper */}
      <div className="border-border-default flex flex-col gap-1.5 border p-3">
        <StepRow
          done={step === "success" || step === "pending-tx"}
          active={step === "waiting-signature"}
          icon={<PenLine className="size-3.5 text-black" />}
          label={confirmLabel}
          error={step === "error" ? error : undefined}
        />

        <DividerDefault isVertical className="ml-3.5 h-6 w-0.5" />

        <StepRow
          done={step === "success"}
          active={step === "pending-tx"}
          icon={<Hourglass className="size-3.5 text-black" />}
          label="Wait for transaction to complete"
        />
      </div>
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
            <SpinIcon className="absolute inset-0 size-8 animate-spin text-orange-500" />
          )}
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full",
              getBackgroundColor(),
            )}
          >
            <div className="border-border-default flex items-center justify-center rounded-full border p-2">
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
