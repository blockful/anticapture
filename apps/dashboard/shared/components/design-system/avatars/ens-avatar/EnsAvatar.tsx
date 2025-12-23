"use client";

import { cn } from "@/shared/utils/cn";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import Blockies from "react-blockies";

import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { useEnsAvatarFromEnsName } from "@/shared/hooks/useEnsData";
import { Address } from "viem";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarVariant = "square" | "rounded";

interface EnsAvatarProps extends Omit<
  ImageProps,
  "src" | "alt" | "fill" | "className" | "loading"
> {
  address: Address; // Used for blockies fallback
  ensName?: `${string}.eth`; // Used for ens avatar
  size?: AvatarSize;
  variant?: AvatarVariant;
  className?: string;
  isEnsLoading?: boolean;
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
  size = "md",
  variant = "rounded",
  className,
  isEnsLoading,
  ensName,
  ...imageProps
}: EnsAvatarProps) => {
  const [imageError, setImageError] = useState<boolean>(false);

  const {
    data: ensAvatar,
    isLoading: ensAvatarLoading,
    error: ensAvatarError,
  } = useEnsAvatarFromEnsName({
    ensName,
  });

  const baseClasses = cn(
    sizeClasses[size],
    variantClasses[variant],
    "relative overflow-hidden bg-surface-hover flex items-center justify-center flex-shrink-0",
    className,
  );

  const avatarElement = () => {
    if (isEnsLoading || ensAvatarLoading) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className={cn(sizeClasses[size], variantClasses[variant])}
        />
      );
    }

    // Show image if available and no error
    if (ensAvatar && !imageError && !ensAvatarError) {
      return (
        <div className={baseClasses}>
          <Image
            src={ensAvatar}
            alt={ensName || ""}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImageError(true)}
            {...imageProps}
          />
        </div>
      );
    }

    // Fallback: show blockies image
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

  return avatarElement();
};
