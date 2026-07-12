"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { useLogin } from "@/shared/services/auth/LoginProvider";

import { DelegationModal } from "@/features/holders-and-delegates/delegate/DelegationModal";
import {
  DelegationReadAbi,
  getDelegationReadContractConfig,
} from "@/features/holders-and-delegates/delegate/utils/getDelegationReadContractConfig";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { BadgeStatus, Button } from "@/shared/components";
import type {
  ButtonSize,
  ButtonVariant,
} from "@/shared/components/design-system/buttons/types";
import { useGaslessEligibility } from "@/shared/hooks/useGaslessRelayer";
import type { DaoIdEnum } from "@/shared/types/daos";

interface DelegateButtonProps {
  delegateAddress: Address;
  daoId: DaoIdEnum;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const DelegateButton = ({
  delegateAddress,
  daoId,
  size = "md",
  variant = "primary",
}: DelegateButtonProps) => {
  const { address: userAddress, isConnected } = useAccount();
  const { openLogin, isOpen: isLoginOpen } = useLogin();
  const [waitingForConnection, setWaitingForConnection] = useState(false);
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);

  const delegationReadConfig = getDelegationReadContractConfig(daoId);

  const { data: currentDelegatee, refetch } = useReadContract({
    abi: DelegationReadAbi,
    address: delegationReadConfig.address,
    functionName: delegationReadConfig.functionName,
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!delegationReadConfig.address },
  });

  const { isEligible: isGaslessEligible } = useGaslessEligibility(
    daoId,
    userAddress,
    "delegate",
  );

  const isAlreadyDelegated =
    !!currentDelegatee &&
    currentDelegatee.toLowerCase() === delegateAddress.toLowerCase();

  useEffect(() => {
    if (!waitingForConnection) return;
    // Sign-in modal still up (including the RainbowKit hand-off, during
    // which it hides but stays open) — keep waiting.
    if (isLoginOpen) return;

    if (isConnected) {
      setWaitingForConnection(false);
      setDelegationModalOpen(true);
    } else {
      setWaitingForConnection(false);
      showCustomToast("Connect your wallet to delegate", "error");
    }
  }, [isLoginOpen, isConnected, waitingForConnection]);

  const handleClick = () => {
    if (!isConnected) {
      // Through the sign-in modal (not raw RainbowKit): connecting a wallet
      // and platform identity are one step, and LoginProvider's coherence
      // sync would disconnect a wallet that connected without signing in.
      setWaitingForConnection(true);
      openLogin();
    } else {
      setDelegationModalOpen(true);
    }
  };

  if (isAlreadyDelegated) {
    return (
      <Button size={size} variant="outline" disabled className="opacity-100">
        <Check className="size-3.5" />
        Delegated
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick}>
        Delegate
        {isGaslessEligible && (
          <BadgeStatus
            variant="success"
            className="bg-success/80 text-inverted"
          >
            Free
          </BadgeStatus>
        )}
      </Button>
      <DelegationModal
        open={delegationModalOpen}
        onClose={() => setDelegationModalOpen(false)}
        delegateAddress={delegateAddress}
        daoId={daoId}
        onSuccess={() => {
          setDelegationModalOpen(false);
          refetch();
        }}
      />
    </>
  );
};
