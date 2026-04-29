"use client";

import { Coins } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, isAddress } from "viem";
import { usePublicClient } from "wagmi";

import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { RadioCard } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import daoConfig from "@/shared/dao-config";
import { isEnsAddress } from "@/shared/hooks/useEnsData";
import { useEthPrice } from "@/shared/hooks/useEthPrice";
import { useTokenData } from "@/shared/hooks/useTokenData";
import type { DaoIdEnum } from "@/shared/types/daos";
import type {
  ERC20TransferAction,
  EthTransferAction,
} from "@/features/create-proposal/types";

type TokenType = "eth" | "erc20";

interface AddTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: EthTransferAction | ERC20TransferAction) => void;
  initialValue?: EthTransferAction | ERC20TransferAction;
}

const governanceTokenAddress = (daoId: DaoIdEnum): string | undefined => {
  const token = daoConfig[daoId]?.daoOverview?.contracts?.token;
  if (typeof token === "string") return token;
  if (Array.isArray(token)) return token[0]?.address;
  return undefined;
};

const EthIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M11.998 2 5.5 12.223l6.498 3.838 6.5-3.838L11.998 2Zm0 15.288L5.5 13.45l6.498 9.053 6.5-9.053-6.5 3.838Z" />
  </svg>
);

export const AddTransferModal = ({
  open,
  onOpenChange,
  onSubmit,
  initialValue,
}: AddTransferModalProps) => {
  const { daoId: daoIdParam } = useParams<{ daoId: string }>();
  const daoIdEnum = (daoIdParam ?? "").toUpperCase() as DaoIdEnum;

  const isEdit = Boolean(initialValue);

  const [tokenType, setTokenType] = useState<TokenType>(
    initialValue?.type === "erc20-transfer" ? "erc20" : "eth",
  );
  const [recipient, setRecipient] = useState(initialValue?.recipient ?? "");
  const [tokenAddress, setTokenAddress] = useState(
    initialValue?.type === "erc20-transfer" ? initialValue.tokenAddress : "",
  );
  const [amount, setAmount] = useState(initialValue?.amount ?? "");
  const [isResolvingDecimals, setIsResolvingDecimals] = useState(false);
  const [decimalsError, setDecimalsError] = useState<string | null>(null);
  const [tokenAddressTouched, setTokenAddressTouched] = useState(false);
  const [recipientTouched, setRecipientTouched] = useState(false);

  // Re-hydrate fields whenever the modal opens with a new initialValue
  useEffect(() => {
    if (!open) return;
    setDecimalsError(null);
    setIsResolvingDecimals(false);
    if (initialValue) {
      setTokenType(initialValue.type === "erc20-transfer" ? "erc20" : "eth");
      setRecipient(initialValue.recipient);
      setTokenAddress(
        initialValue.type === "erc20-transfer" ? initialValue.tokenAddress : "",
      );
      setAmount(initialValue.amount);
    } else {
      setTokenType("eth");
      setRecipient("");
      setTokenAddress("");
      setAmount("");
    }
  }, [open, initialValue]);

  const { data: governanceTokenData } = useTokenData(daoIdEnum);
  const { price: ethPrice } = useEthPrice();
  const governanceChainId = daoConfig[daoIdEnum]?.daoOverview?.chain?.id;
  const publicClient = usePublicClient(
    governanceChainId ? { chainId: governanceChainId } : undefined,
  );

  const usd = useMemo(() => {
    const n = Number(amount);
    if (!amount || Number.isNaN(n) || n <= 0) return null;

    // ETH transfer — convert using live ETH price
    if (tokenType === "eth") {
      if (!ethPrice) return null;
      return n * ethPrice;
    }

    // ERC-20 governance token — use existing token data price
    const govAddress = governanceTokenAddress(daoIdEnum);
    const isGovToken =
      govAddress &&
      tokenAddress.trim() !== "" &&
      tokenAddress.toLowerCase() === govAddress.toLowerCase();
    if (!isGovToken) return null;

    const price = Number(governanceTokenData?.price ?? 0);
    if (!price) return null;
    return n * price;
  }, [
    tokenType,
    amount,
    tokenAddress,
    daoIdEnum,
    governanceTokenData,
    ethPrice,
  ]);

  const usdDisplay =
    usd !== null
      ? `$${usd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "";

  const usdSourceLabel = useMemo(() => {
    if (tokenType === "eth")
      return "Conversion price was resolved using CoinGecko.";
    return "Conversion price was resolved using CoinGecko.";
  }, [tokenType]);

  const reset = () => {
    setTokenType("eth");
    setRecipient("");
    setTokenAddress("");
    setAmount("");
    setTokenAddressTouched(false);
    setRecipientTouched(false);
  };

  const recipientTrimmed = recipient.trim();
  const recipientIsValid =
    recipientTrimmed !== "" &&
    (isAddress(recipientTrimmed) || isEnsAddress(recipientTrimmed));
  const recipientError =
    recipientTouched && recipientTrimmed !== "" && !recipientIsValid;
  const tokenAddressError =
    tokenAddressTouched &&
    tokenAddress.trim() !== "" &&
    !isAddress(tokenAddress.trim());
  const recipientValid = recipientIsValid;
  const tokenAddressValid =
    tokenType === "eth" ||
    (tokenAddress.trim() !== "" && isAddress(tokenAddress.trim()));

  const amountTrimmed = amount.trim();
  const amountIsValid =
    amountTrimmed !== "" &&
    /^\d+(\.\d+)?$/.test(amountTrimmed) &&
    parseFloat(amountTrimmed) > 0;

  const handleConfirm = async () => {
    setDecimalsError(null);
    if (tokenType === "eth") {
      onSubmit({ type: "eth-transfer", recipient, amount });
      reset();
      onOpenChange(false);
      return;
    }
    if (!publicClient) {
      setDecimalsError(
        "No RPC client available. Please reconnect your wallet and try again.",
      );
      return;
    }
    setIsResolvingDecimals(true);
    try {
      const decimals = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "decimals",
      });
      onSubmit({
        type: "erc20-transfer",
        recipient,
        tokenAddress,
        amount,
        decimals: Number(decimals),
      });
      reset();
      onOpenChange(false);
    } catch {
      setDecimalsError(
        "Could not read token decimals from this contract. Make sure the address points to a standard ERC-20.",
      );
    } finally {
      setIsResolvingDecimals(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title={isEdit ? "Edit Transfer" : "Add Transfer"}
      cancelLabel="Cancel"
      confirmLabel="Confirm"
      onCancel={() => {
        reset();
        onOpenChange(false);
      }}
      onConfirm={() => {
        void handleConfirm();
      }}
      isConfirmDisabled={
        !recipientValid ||
        !amountIsValid ||
        !tokenAddressValid ||
        isResolvingDecimals
      }
      isConfirmLoading={isResolvingDecimals}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FormLabel isRequired>Recipient</FormLabel>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onBlur={() => setRecipientTouched(true)}
            placeholder="Address or ENS"
            error={recipientError}
          />
          {recipientError && (
            <span className="text-error text-xs">
              Must be a valid address or ENS name
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FormLabel isRequired>Token</FormLabel>
          <div className="flex gap-2">
            <RadioCard
              label="ETH"
              icon={<EthIcon className="size-4" />}
              placementRight
              isActive={tokenType === "eth"}
              onClick={() => setTokenType("eth")}
            />
            <RadioCard
              label="ERC-20"
              icon={<Coins className="size-4" />}
              placementRight
              isActive={tokenType === "erc20"}
              onClick={() => setTokenType("erc20")}
            />
          </div>
        </div>

        {tokenType === "erc20" && (
          <div className="flex flex-col gap-1.5">
            <FormLabel isRequired>Token Contract Address</FormLabel>
            <Input
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              onBlur={() => setTokenAddressTouched(true)}
              placeholder="0x…"
              error={tokenAddressError}
            />
            {tokenAddressError && (
              <span className="text-error text-xs">
                Must be a valid Ethereum address
              </span>
            )}
            {decimalsError && (
              <span className="text-error text-xs">{decimalsError}</span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <FormLabel isRequired>Amount</FormLabel>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <FormLabel>USD</FormLabel>
              <Input
                value={usdDisplay}
                disabled
                placeholder="$0.00"
                tabIndex={-1}
              />
            </div>
          </div>
          {usd !== null && (
            <span className="text-secondary text-xs">{usdSourceLabel}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};
