"use client";

import { Check, Hourglass, PenLine } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Account, Address } from "viem";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWalletClient } from "wagmi";

import { delegateTo } from "@/features/holders-and-delegates/delegate/utils/delegateTo";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { cn } from "@/shared/utils/cn";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";

const ERC20VotesAbi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type DelegationStep = "waiting-signature" | "pending-tx" | "success" | "error";

interface DelegationModalProps {
  open: boolean;
  onClose: () => void;
  delegateAddress: Address;
  daoId: DaoIdEnum;
  onSuccess?: () => void;
}

export const DelegationModal = ({
  open,
  onClose,
  delegateAddress,
  daoId,
  onSuccess,
}: DelegationModalProps) => {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [step, setStep] = useState<DelegationStep>("waiting-signature");
  const [error, setError] = useState<string | null>(null);

  const daoConfig = daoConfigByDaoId[daoId];
  const tokenAddress = daoConfig?.daoOverview?.contracts?.token as
    | Address
    | undefined;
  const decimals = daoConfig?.decimals ?? 18;

  const { data: votingPowerRaw } = useReadContract({
    abi: ERC20VotesAbi,
    address: tokenAddress,
    functionName: "getVotes",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!tokenAddress },
  });

  const votingPower =
    votingPowerRaw !== undefined
      ? formatNumberUserReadable(Number(formatUnits(votingPowerRaw, decimals)))
      : "—";

  const handleDelegate = useCallback(async () => {
    if (!userAddress || !walletClient || !tokenAddress) return;
    if (step === "pending-tx" || step === "success") return;

    setError(null);
    setStep("waiting-signature");

    try {
      await delegateTo(
        tokenAddress,
        delegateAddress,
        userAddress as unknown as Account,
        walletClient,
        () => setStep("pending-tx"),
      );
      setStep("success");
      showCustomToast("Delegation successful!", "success");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delegation failed.";
      const isRejected =
        message.includes("rejected") || message.includes("denied");
      setError(isRejected ? "Transaction rejected by user." : message);
      setStep("error");
    }
  }, [
    userAddress,
    walletClient,
    tokenAddress,
    step,
    delegateAddress,
    onSuccess,
  ]);

  useEffect(() => {
    if (!open || !walletClient || step !== "waiting-signature") return;
    handleDelegate();
  }, [open, walletClient, handleDelegate, step]);

  const handleClose = () => {
    setStep("waiting-signature");
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      title="Delegate voting power"
    >
      {/* Context */}
      <div className="flex flex-col gap-2 pb-4">
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Your voting power
          </span>
          <span className="text-primary text-sm leading-5">{votingPower}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Delegating to
          </span>
          <EnsAvatar
            address={delegateAddress}
            size="xs"
            showTags={false}
            showCopyAddress={false}
          />
        </div>
      </div>

      {/* Stepper */}
      <div className="border-border-default flex flex-col gap-1.5 border p-3">
        <StepRow
          done={step === "success" || step === "pending-tx"}
          active={step === "waiting-signature"}
          icon={<PenLine className="text-inverted size-3.5" />}
          label="Confirm your delegation in your wallet"
          error={step === "error" ? error : undefined}
        />

        <DividerDefault isVertical className="ml-3.5 h-6 w-0.5" />

        <StepRow
          done={step === "success"}
          active={step === "pending-tx"}
          icon={<Hourglass className="text-inverted size-3.5" />}
          label="Wait for the delegation to complete"
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
            <SpinIcon className="text-link absolute inset-0 size-8 animate-spin" />
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

      {error && <p className="text-error ml-11 text-xs leading-4">{error}</p>}
    </div>
  );
};
