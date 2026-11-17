"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Hourglass, PenLine, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWalletClient } from "wagmi";

import {
  getRateLimitQueryKey,
  getRelayerStatusQueryKey,
} from "@anticapture/client/hooks";
import type {
  GetRateLimitPathParamsDaoEnumKey,
  GetRelayerStatusPathParamsDaoEnumKey,
} from "@anticapture/client";

import { delegateTo } from "@/features/holders-and-delegates/delegate/utils/delegateTo";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import {
  describeGaslessFailure,
  isUserRejection,
} from "@/shared/utils/gaslessRelayerError";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import daoConfigByDaoId from "@/shared/dao-config";
import {
  useGaslessEligibility,
  useRelayerConfig,
} from "@/shared/hooks/useGaslessRelayer";
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
  const queryClient = useQueryClient();
  const [step, setStep] = useState<DelegationStep>("waiting-signature");
  const [error, setError] = useState<string | null>(null);
  // The account whose gas-free delegation the relayer last refused or never
  // confirmed. That account delegates from its own wallet from then on, the
  // same rule the ballot follows: the wallet is the guarantee, and offering
  // the relayer that just failed would only fail again. Keyed by account so
  // switching wallets starts clean.
  const [gaslessFailedFor, setGaslessFailedFor] = useState<Address | null>(
    null,
  );
  const gaslessFailed =
    !!userAddress &&
    gaslessFailedFor?.toLowerCase() === userAddress.toLowerCase();
  // One delegation at a time. The effect below runs handleDelegate whenever
  // its inputs change while the modal waits for a signature, and the relayer
  // status now refreshes in the background, so without this a refresh during
  // signing would ask the wallet for a second signature.
  const inFlight = useRef(false);

  const daoConfig = daoConfigByDaoId[daoId];
  const tokenAddress = daoConfig?.daoOverview?.contracts?.token as
    | Address
    | undefined;
  const chain = daoConfig?.daoOverview?.chain;
  const { data: walletClient } = useWalletClient({ chainId: chain?.id });
  const decimals = daoConfig?.decimals ?? 18;

  const { minVotingPower } = useRelayerConfig(daoId);
  const { isEligible: isGaslessEligible, remaining: delegationRemaining } =
    useGaslessEligibility(daoId, userAddress, "delegate");

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
    if (inFlight.current) return;
    inFlight.current = true;

    setError(null);
    setStep("waiting-signature");

    const isGasless =
      isGaslessEligible && daoConfig?.gaslessRelayer === true && !gaslessFailed;
    try {
      await delegateTo(
        tokenAddress,
        delegateAddress,
        userAddress,
        walletClient,
        () => setStep("pending-tx"),
        chain,
        daoId,
        isGasless,
      );
      setStep("success");
      showCustomToast("Delegation successful!", "success");
      onSuccess?.();
    } catch (err) {
      if (isUserRejection(err)) {
        setError("Transaction rejected by user.");
        setStep("error");
        return;
      }

      if (isGasless) {
        // Any relayer failure moves this account to its wallet. Delegating
        // again to the same delegate is idempotent, so even a relayed
        // delegation that lands late costs the wallet path nothing but gas.
        setGaslessFailedFor(userAddress);
        setError(
          `${describeGaslessFailure(err, {
            operation: "delegate",
            minVotingPower,
            decimals,
            symbol: daoConfig.name,
          })} You can still delegate with your wallet and pay the network fee.`,
        );
        void queryClient.invalidateQueries({
          queryKey: getRelayerStatusQueryKey(
            daoId.toLowerCase() as GetRelayerStatusPathParamsDaoEnumKey,
          ),
        });
      } else {
        const message =
          err instanceof Error ? err.message : "Delegation failed.";
        setError(message);
      }
      setStep("error");
    } finally {
      inFlight.current = false;
      // The relayer counts each delegation against a monthly allowance, and
      // the cached count is stale for a minute: without this, a delegation
      // right after the last free one still goes to the relayer and gets 429.
      if (isGasless) {
        void queryClient.invalidateQueries({
          queryKey: getRateLimitQueryKey(
            daoId.toLowerCase() as GetRateLimitPathParamsDaoEnumKey,
            userAddress,
          ),
        });
      }
    }
  }, [
    userAddress,
    walletClient,
    tokenAddress,
    step,
    delegateAddress,
    onSuccess,
    chain,
    daoId,
    daoConfig,
    decimals,
    minVotingPower,
    isGaslessEligible,
    gaslessFailed,
    queryClient,
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
        {isGaslessEligible &&
          !gaslessFailed &&
          delegationRemaining !== null && (
            <InlineAlert
              variant="success"
              text={
                delegationRemaining === 1
                  ? "This delegation is free! Last one this month — resets next month."
                  : `This delegation is free! You'll still have ${
                      delegationRemaining - 1
                    } left to use this month.`
              }
              className="mt-2"
            />
          )}
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

      {step === "error" && gaslessFailed && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => {
              setError(null);
              setStep("waiting-signature");
            }}
            data-ph-event="delegate_wallet_fallback"
            data-ph-source="gov_fe"
            data-umami-event="delegate_wallet_fallback"
          >
            <Wallet className="size-3.5" />
            Delegate with my wallet
          </Button>
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
