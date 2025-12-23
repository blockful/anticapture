"use client";

import { useEnsNameFromAddress } from "@/shared/hooks/useEnsData";
import { cn } from "@/shared/utils/cn";
import { Address } from "viem";

import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { formatAddress } from "@/shared/utils/formatAddress";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarVariant = "square" | "rounded";

interface EnsNameWithAvatarProps {
  address: Address;
  ensName?: `${string}.eth`;
  size?: AvatarSize;
  variant?: AvatarVariant;
  loading?: boolean;
  className?: string;
  alt?: string;
  showAvatar?: boolean;
  nameClassName?: string;
  containerClassName?: string;
  isDashed?: boolean;
  showFullAddress?: boolean;
}

export const EnsNameWithAvatar = ({
  address,
  size = "md",
  variant = "rounded",
  loading = false,
  showAvatar = true,
  nameClassName,
  containerClassName,
  showFullAddress = false,
  isDashed = false,
}: EnsNameWithAvatarProps) => {
  const { data: ensName, isLoading: ensNameLoading } = useEnsNameFromAddress({
    address,
  });

  // Determine what to display as the name
  const getDisplayName = () => {
    if (ensName) {
      return ensName;
    }
    return showFullAddress ? address : formatAddress(address);
  };

  const displayName = getDisplayName();
  const isLoadingName = loading || ensNameLoading;
  const isEnsName = Boolean(ensName);

  if (!showAvatar) {
    return (
      <span className={cn("text-primary text-sm", nameClassName)}>
        {displayName}
      </span>
    );
  }

  // Return avatar with name
  return (
    <div className={cn("flex min-w-0 items-center gap-3", containerClassName)}>
      <EnsAvatar
        address={address}
        ensName={ensName as `${string}.eth` | undefined}
        isEnsLoading={isLoadingName}
        size={size}
        variant={variant}
      />

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          {isLoadingName ? (
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-24"
            />
          ) : (
            <span
              className={cn(
                "text-primary inline-block text-sm",
                isEnsName && "overflow-hidden truncate whitespace-nowrap",
                isDashed && "border-b border-dashed border-[#3F3F46]",
                nameClassName,
              )}
            >
              {displayName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
