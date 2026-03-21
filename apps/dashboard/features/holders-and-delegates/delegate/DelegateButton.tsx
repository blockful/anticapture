"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { DelegationModal } from "@/features/holders-and-delegates/delegate/DelegationModal";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { Button } from "@/shared/components";
import type { ButtonSize } from "@/shared/components/design-system/buttons/types";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const ERC20VotesAbi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "delegates",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface DelegateButtonProps {
  delegateAddress: Address;
  daoId: DaoIdEnum;
  size?: ButtonSize;
}

export const DelegateButton = ({
  delegateAddress,
  daoId,
  size = "md",
}: DelegateButtonProps) => {
  const { address: userAddress, isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const [waitingForConnection, setWaitingForConnection] = useState(false);
  const [delegationModalOpen, setDelegationModalOpen] = useState(false);

  const daoConfig = daoConfigByDaoId[daoId];
  const tokenAddress = daoConfig?.daoOverview?.contracts?.token as
    | Address
    | undefined;

  const { data: currentDelegatee, refetch } = useReadContract({
    abi: ERC20VotesAbi,
    address: tokenAddress,
    functionName: "delegates",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!tokenAddress },
  });

  const isAlreadyDelegated =
    !!currentDelegatee &&
    currentDelegatee.toLowerCase() === delegateAddress.toLowerCase();

  useEffect(() => {
    if (!waitingForConnection) return;
    if (connectModalOpen) return;

    if (isConnected) {
      setWaitingForConnection(false);
      setDelegationModalOpen(true);
    } else {
      setWaitingForConnection(false);
      showCustomToast("Connect your wallet to delegate", "error");
    }
  }, [connectModalOpen, isConnected, waitingForConnection]);

  const handleClick = () => {
    if (!isConnected) {
      setWaitingForConnection(true);
      openConnectModal?.();
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
      <Button size={size} onClick={handleClick}>
        Delegate
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
