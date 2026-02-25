"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import Blockies from "react-blockies";
import { Address } from "viem";

import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { AddressDetailsTooltip } from "@/shared/components/tooltips/AddressDetailsTooltip";
import { useArkhamData } from "@/shared/hooks/graphql-client/useArkhamData";
import { useEnsData } from "@/shared/hooks/useEnsData";
import { cn } from "@/shared/utils/cn";
import { formatAddress } from "@/shared/utils/formatAddress";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarVariant = "square" | "rounded";

interface EnsAvatarProps extends Omit<
  ImageProps,
  "src" | "alt" | "fill" | "className" | "loading"
> {
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
  showTags?: boolean;
  showCopyAddress?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-4", // 16px
  sm: "size-6", // 24px
  md: "size-9", // 36px
  lg: "size-12", // 48px
};

const imageSizeClasses: Record<AvatarSize, number> = {
  xs: 16, // 16px
  sm: 24, // 24px
  md: 36, // 36px
  lg: 48, // 48px
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
  showTags = false,
  showCopyAddress = false,
  ...imageProps
}: EnsAvatarProps) => {
  // Only fetch ENS data if we have an address and either we need imageUrl or fetchEnsName is true
  const shouldFetchEns = address && !imageUrl;
  const { data: ensData, isLoading: ensLoading } = useEnsData(
    shouldFetchEns ? address : null,
  );
  const { arkham, isContract, loading: arkhamLoading } = useArkhamData(address);

  const [imageError, setImageError] = useState(false);

  // Determine the final image URL to use
  const finalImageUrl = imageUrl || ensData?.avatarUrl;

  const handleImageError = () => {
    setImageError(true);
  };

  // Determine alt text
  const finalAlt = alt || ensData?.ens || address || "Avatar";

  // Determine what to display as the name
  const getDisplayName = () => {
    if (ensData?.ens) return ensData.ens;

    const entity = arkham?.entity;
    const label = arkham?.label;

    let name: string;
    if (entity && label) name = `${entity} · ${label}`;
    else if (entity) name = entity;
    else if (label) name = label;
    else if (address) name = showFullAddress ? address : formatAddress(address);
    else name = "Unknown";

    if (showFullAddress) return name;
    return name.length > 30 ? `${name.slice(0, 30)}…` : name;
  };

  const displayName = getDisplayName();
  const isLoadingName = loading || (ensLoading && !address);
  const isResolvingData = !!address && (ensLoading || arkhamLoading);

  const baseClasses = cn(
    sizeClasses[size],
    variantClasses[variant],
    "relative overflow-hidden bg-surface-hover flex items-center justify-center flex-shrink-0",
    className,
  );

  const avatarElement = () => {
    if (loading || (ensLoading && !address)) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className={cn(sizeClasses[size], variantClasses[variant])}
        />
      );
    }

    // Show image if available and not previously failed
    if (finalImageUrl && !imageError) {
      return (
        <div className={baseClasses}>
          <Image
            src={finalImageUrl}
            alt={finalAlt}
            width={imageSizeClasses[size]}
            height={imageSizeClasses[size]}
            className="object-cover"
            onError={handleImageError}
            {...imageProps}
          />
        </div>
      );
    }

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

  const tags = showTags
    ? [
        arkham?.twitter && `@${arkham.twitter}`,
        ensData?.ens,
        address && formatAddress(address),
        arkham?.entityType &&
          (["cex", "dex"].includes(arkham.entityType.toLowerCase())
            ? arkham.entityType.toUpperCase()
            : arkham.entityType),
        isContract !== null ? (isContract ? "Contract" : "EOA") : null,
      ].filter(Boolean)
    : [];

  // Return avatar with name
  const avatarWithName = (
    <div className={cn("flex min-w-0 items-center gap-2", containerClassName)}>
      {avatarElement()}

      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {isLoadingName ? (
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-24"
            />
          ) : (
            <span
              className={cn(
                "text-primary inline-block overflow-hidden truncate whitespace-nowrap",
                showTags ? "text-lg font-medium" : "text-sm",
                isDashed && "border-b border-dashed border-[#3F3F46]",
                isResolvingData && "animate-pulse",
                nameClassName,
              )}
            >
              {displayName}
            </span>
          )}
          {showCopyAddress && address && (
            <CopyAndPasteButton
              textToCopy={address}
              className="p-1"
              iconSize="md"
              customTooltipText={{
                default: "Copy address",
                copied: "Address copied!",
              }}
            />
          )}
        </div>

        {showTags && (
          <div className="flex flex-wrap items-center gap-1">
            {arkhamLoading || ensLoading ? (
              <>
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-5 w-16 rounded-full"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-5 w-20 rounded-full"
                />
              </>
            ) : (
              tags.map((tag) => (
                <BadgeStatus key={tag} variant="secondary">
                  {tag}
                </BadgeStatus>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (address && !showTags) {
    return (
      <>
        <span className="hidden md:contents">
          <AddressDetailsTooltip
            address={address}
            arkham={arkham}
            ens={ensData ? { name: ensData.ens ?? null } : null}
            isContract={isContract}
            loading={ensLoading || arkhamLoading}
          >
            {avatarWithName}
          </AddressDetailsTooltip>
        </span>
        <span className="contents md:hidden">{avatarWithName}</span>
      </>
    );
  }

  return avatarWithName;
};
