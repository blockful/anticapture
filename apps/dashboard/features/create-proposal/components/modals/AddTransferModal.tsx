"use client";

import { Coins } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits, isAddress } from "viem";
import { useBalance, usePublicClient, useReadContracts } from "wagmi";

import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { RadioCard } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import daoConfig from "@/shared/dao-config";
import { isEnsAddress } from "@/shared/utils/ens";

import { useEthPrice } from "@/shared/hooks/useEthPrice";
import { useTokenPrice } from "@/shared/hooks/useTokenPrice";
import { cn } from "@/shared/utils/cn";
import type { DaoIdEnum } from "@/shared/types/daos";
import { SUGGESTED_TRANSFER_TOKENS } from "@/features/create-proposal/constants";
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

  const { price: ethPrice } = useEthPrice();
  const governanceChainId = daoConfig[daoIdEnum]?.daoOverview?.chain?.id;
  const publicClient = usePublicClient(
    governanceChainId ? { chainId: governanceChainId } : undefined,
  );

  // The timelock is the treasury that actually pays when the proposal executes,
  // so balances/limits are measured against it — not the author's wallet.
  const treasuryAddress =
    daoConfig[daoIdEnum]?.daoOverview?.contracts?.timelock;

  const tokenAddressTrimmed = tokenAddress.trim();
  const isErc20WithAddress =
    tokenType === "erc20" && isAddress(tokenAddressTrimmed);

  const { data: ethBalance } = useBalance({
    address: treasuryAddress,
    chainId: governanceChainId,
    query: { enabled: tokenType === "eth" && Boolean(treasuryAddress) },
  });

  const { data: erc20Data } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        abi: erc20Abi,
        address: tokenAddressTrimmed as `0x${string}`,
        functionName: "balanceOf",
        args: [treasuryAddress ?? "0x"],
        chainId: governanceChainId,
      },
      {
        abi: erc20Abi,
        address: tokenAddressTrimmed as `0x${string}`,
        functionName: "decimals",
        chainId: governanceChainId,
      },
    ],
    query: { enabled: isErc20WithAddress && Boolean(treasuryAddress) },
  });

  const { price: selectedTokenPrice } = useTokenPrice(
    isErc20WithAddress ? tokenAddressTrimmed : undefined,
    governanceChainId,
  );

  const suggestedTokens = SUGGESTED_TRANSFER_TOKENS[daoIdEnum] ?? [];

  // Available treasury balance for the selected asset (human-readable).
  const available = useMemo<{
    formatted: string;
    symbol: string;
  } | null>(() => {
    if (tokenType === "eth") {
      if (!ethBalance) return null;
      return {
        formatted: formatUnits(ethBalance.value, ethBalance.decimals),
        symbol: ethBalance.symbol,
      };
    }
    if (!erc20Data) return null;
    const [rawBalance, decimals] = erc20Data;
    return { formatted: formatUnits(rawBalance, Number(decimals)), symbol: "" };
  }, [tokenType, ethBalance, erc20Data]);

  const usd = useMemo(() => {
    const n = Number(amount);
    if (!amount || Number.isNaN(n) || n <= 0) return null;
    if (tokenType === "eth") {
      if (!ethPrice) return null;
      return n * ethPrice;
    }
    if (!selectedTokenPrice) return null;
    return n * selectedTokenPrice;
  }, [tokenType, amount, ethPrice, selectedTokenPrice]);

  const usdDisplay =
    usd !== null
      ? `$${usd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "";

  const usdSourceLabel = "Conversion price was resolved using CoinGecko.";

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

  const exceedsBalance =
    available !== null &&
    amountIsValid &&
    parseFloat(amountTrimmed) > parseFloat(available.formatted);

  const fillMax = () => {
    if (available) setAmount(available.formatted);
  };

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
        recipient: recipientTrimmed,
        tokenAddress,
        amount: amountTrimmed,
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
              label="ERC-20 Token"
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
            {suggestedTokens.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {suggestedTokens.map((token) => {
                  const isActive =
                    tokenAddress.trim().toLowerCase() ===
                    token.address.toLowerCase();
                  return (
                    <button
                      key={token.address}
                      type="button"
                      onClick={() => {
                        setTokenAddress(token.address);
                        setTokenAddressTouched(true);
                        setDecimalsError(null);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                        isActive
                          ? "border-border-action bg-surface-opacity-brand text-primary ring-border-action ring-1"
                          : "border-border-contrast text-secondary hover:bg-surface-contrast",
                      )}
                      aria-pressed={isActive}
                    >
                      <Image
                        src={token.logoUri}
                        alt=""
                        aria-hidden
                        width={16}
                        height={16}
                        className="shrink-0 rounded-full object-cover"
                      />
                      {token.symbol}
                    </button>
                  );
                })}
              </div>
            )}
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
              <div className="flex items-center justify-between gap-2">
                <FormLabel isRequired>Amount</FormLabel>
                {available && (
                  <button
                    type="button"
                    onClick={fillMax}
                    className="text-highlight text-xs font-medium hover:underline"
                  >
                    Max:{" "}
                    {Number(available.formatted).toLocaleString("en-US", {
                      maximumFractionDigits: 6,
                    })}
                    {available.symbol ? ` ${available.symbol}` : ""}
                  </button>
                )}
              </div>
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
          {exceedsBalance && (
            <span className="text-warning text-xs">
              Amount exceeds the treasury&apos;s available balance — the
              proposal would revert on execution.
            </span>
          )}
          <span className="text-secondary text-xs">
            {usd !== null
              ? usdSourceLabel
              : "USD value appears when a price is available for the selected asset."}
          </span>
        </div>
      </div>
    </Modal>
  );
};
