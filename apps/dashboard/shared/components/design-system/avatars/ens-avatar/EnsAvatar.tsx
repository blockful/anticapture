"use client";

import { useEnsData } from "@/shared/hooks/useEnsData";
import { cn } from "@/shared/utils/cn";
import { Address } from "viem";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { UserIcon } from "@/shared/components/icons";

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
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-4", // 16px
  sm: "size-6", // 24px
  md: "size-9", // 36px
  lg: "size-12", // 48px
};

const iconSizes: Record<AvatarSize, string> = {
  xs: "size-3", // 12px
  sm: "size-4", // 16px
  md: "size-6", // 24px
  lg: "size-8", // 32px
};

const variantClasses: Record<AvatarVariant, string> = {
  square: "rounded-sm",
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
  ...imageProps
}: EnsAvatarProps) => {
  const [imageError, setImageError] = useState<boolean>(false);

  // Only fetch ENS data if we have an address and no imageUrl provided
  const addressToFetch = address && !imageUrl ? address : undefined;
  const { data: ensData, isLoading: ensLoading } = useEnsData(
    addressToFetch as Address,
  );

  // Determine the final image URL to use
  const finalImageUrl = imageUrl || ensData?.avatar_url;

  // Determine alt text
  const finalAlt = alt || ensData?.ens || address || "Avatar";

  const baseClasses = cn(
    sizeClasses[size],
    variantClasses[variant],
    "relative overflow-hidden bg-gray-700/50 flex items-center justify-center",
    className,
  );

  // Show skeleton when loading (either external loading prop or ENS data loading)
  const isLoading = loading || ensLoading;
  if (isLoading) {
    return <div className={cn(baseClasses, "animate-pulse bg-gray-700/50")} />;
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
      <UserIcon className={iconSizes[size]} />
    </div>
  );
};
