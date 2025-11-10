"use client";

import { useEnsData } from "@/shared/hooks/useEnsData";
import { cn } from "@/shared/utils/cn";
// import { formatAddress } from "@/shared/utils/formatAddress";
import { Address } from "viem";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import Blockies from "react-blockies";

import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { formatAddress } from "@/shared/utils/formatAddress";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarVariant = "square" | "rounded";

interface EnsAvatarProps
  extends Omit<ImageProps, "src" | "alt" | "fill" | "className" | "loading"> {
  address?: Address;
  imageUrl?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  loading?: boolean;
  className?: string;
  alt?: string;
  showName?: boolean;
  showAvatar?: boolean;
  nameClassName?: string;
  containerClassName?: string;
  isDashed?: boolean;
  showFullAddress?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-4", // 16px
  sm: "size-6", // 24px
  md: "size-9", // 36px
  lg: "size-12", // 48px
};

const iconSizes: Record<AvatarSize, number> = {
  xs: 12, // 12px
  sm: 16, // 16px
  md: 24, // 24px
  lg: 32, // 32px
};

const variantClasses: Record<AvatarVariant, string> = {
  square: "rounded-md",
  rounded: "rounded-full",
};

export const EnsAvatar = ({
  address,
  imageUrl,
  size = "md",
  variant = "rounded",
  loading = false,
  className,
  alt,
  showName = true,
  showAvatar = true,
  nameClassName,
  containerClassName,
  showFullAddress = false,
  isDashed = false,
  ...imageProps
}: EnsAvatarProps) => {
  const [imageError, setImageError] = useState<boolean>(false);

  // Only fetch ENS data if we have an address and either we need imageUrl or fetchEnsName is true
  const shouldFetchEns = address && !imageUrl;
  const { data: ensData, isLoading: ensLoading } = useEnsData(
    shouldFetchEns ? address : ("" as Address),
  );

  // Determine the final image URL to use
  const finalImageUrl =
    imageUrl ||
    (ensData?.avatar && ensData.avatar.includes("http")
      ? ensData.avatar
      : ensData?.avatar_url);

  // Determine alt text
  const finalAlt = alt || ensData?.ens || address || "Avatar";

  // Determine what to display as the name
  const getDisplayName = () => {
    if (ensData?.ens) {
      return ensData.ens;
    }
    if (address) {
      return showFullAddress ? address : formatAddress(address);
    }
    return "Unknown";
  };

  const displayName = getDisplayName();
  const isLoadingName = loading || ensLoading;
  const isEnsName = Boolean(ensData?.ens);

  const baseClasses = cn(
    sizeClasses[size],
    variantClasses[variant],
    "relative overflow-hidden bg-surface-hover flex items-center justify-center flex-shrink-0",
    className,
  );

  // Show skeleton when loading (either external loading prop or ENS data loading)
  const isLoading = loading || ensLoading;

  const avatarElement = () => {
    if (isLoading) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className={cn(sizeClasses[size], variantClasses[variant])}
        />
      );
    }

    // Show image if available and no error
    if (finalImageUrl && !imageError) {
      return (
        <div className={baseClasses}>
          <Image
            src={finalImageUrl}
            alt={finalAlt}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            {...imageProps}
          />
        </div>
      );
    }

    // Fallback: show user icon
    return (
      <div className={baseClasses}>
        <Blockies
          seed={address as string}
          size={iconSizes[size]}
          scale={3}
          color="#18181b"
          bgColor="#ec762e"
          spotColor="#ffffff"
        />
      </div>
    );
  };

  // If showName is false, return just the avatar
  if (!showName) {
    return avatarElement();
  }

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
      {avatarElement()}

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
