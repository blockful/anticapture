"use client";

import type { ImageProps } from "next/image";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useState } from "react";
import Blockies from "react-blockies";
import type { Address } from "viem";

import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import {
  EnsSocialLinks,
  buildSocialLinks,
  type EnsSocials,
} from "@/shared/components/design-system/avatars/ens-avatar/EnsSocialLinks";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { AddressDetailsTooltip } from "@/shared/components/tooltips/AddressDetailsTooltip";
import { cn } from "@/shared/utils/cn";
import { formatAddress } from "@/shared/utils/formatAddress";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { useGetAddress } from "@anticapture/client/hooks";

const TRUNCATE_ADDRESS_LENGTH = 30;

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
  maxVisibleTags?: number;
  /** Render EFP follower/following stats (from enrichment data) between the name and tags. */
  showEfpStats?: boolean;
  /** Render ENS social record links (from enrichment data) below the tags. */
  showSocials?: boolean;
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
  maxVisibleTags,
  showEfpStats = false,
  showSocials = false,
  ...imageProps
}: EnsAvatarProps) => {
  const { data, isLoading } = useGetAddress(address ?? "0x", {
    query: { enabled: !!address },
  });
  const arkham = data?.arkham ?? null;
  const ens = data?.ens ?? null;
  const efp = data?.efp ?? null;
  const isContract = data?.isContract ?? null;

  const [imageError, setImageError] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [brandColor, setBrandColor] = useState("#ec762e");

  const blockiesRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    const value = getComputedStyle(node)
      .getPropertyValue("--base-brand")
      .trim();
    if (value && value !== brandColor) setBrandColor(value);
  };

  const finalImageUrl = imageUrl || ens?.avatar;

  const handleImageError = () => {
    setImageError(true);
  };

  const finalAlt = alt || ens?.name || address || "Avatar";

  const getDisplayName = () => {
    const truncate = (name: string) => {
      if (showFullAddress || name.length <= TRUNCATE_ADDRESS_LENGTH)
        return name;
      return `${name.slice(0, TRUNCATE_ADDRESS_LENGTH)}…`;
    };

    if (ens?.name) return ens.name;

    const entity = arkham?.entity;
    const label = arkham?.label;

    if (entity && label) return truncate(`${entity} · ${label}`);
    if (entity) return truncate(entity);
    if (label) return truncate(label);
    if (address) return showFullAddress ? address : formatAddress(address);
    return "Unknown";
  };

  const displayName = getDisplayName();
  const isLoadingName = loading || (isLoading && !address);
  const isResolvingData = !!address && isLoading;

  const baseClasses = cn(
    sizeClasses[size],
    variantClasses[variant],
    "relative overflow-hidden bg-surface-hover flex items-center justify-center flex-shrink-0",
    className,
  );

  const avatarElement = () => {
    if (loading || (isLoading && !address)) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className={cn(sizeClasses[size], variantClasses[variant])}
        />
      );
    }

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
      <div ref={blockiesRef} className={baseClasses}>
        <Blockies
          seed={address ?? ""}
          size={iconSizes[size]}
          scale={3}
          color="#18181b"
          bgColor={brandColor}
          spotColor="#ffffff"
        />
      </div>
    );
  };

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

  const getContractLabel = () => {
    if (isContract === null) return null;
    return isContract ? "Contract" : "EOA";
  };

  const allTags = showTags
    ? [
        arkham?.twitter && `@${arkham.twitter}`,
        ens?.name,
        address && formatAddress(address),
        arkham?.entityType &&
          (["cex", "dex"].includes(arkham.entityType.toLowerCase())
            ? arkham.entityType.toUpperCase()
            : arkham.entityType),
        getContractLabel(),
      ].filter(Boolean)
    : [];

  const tags =
    maxVisibleTags !== undefined && !tagsExpanded
      ? allTags.slice(0, maxVisibleTags)
      : allTags;
  const hiddenTagsCount =
    maxVisibleTags !== undefined && !tagsExpanded
      ? Math.max(0, allTags.length - maxVisibleTags)
      : 0;

  const efpFollowers = showEfpStats ? (efp?.followers ?? null) : null;
  const efpFollowing = showEfpStats ? (efp?.following ?? null) : null;

  const socials: EnsSocials | null =
    showSocials && ens
      ? {
          twitter: ens.twitter,
          telegram: ens.telegram,
          github: ens.github,
          email: ens.email,
        }
      : null;
  const hasSocials = socials ? buildSocialLinks(socials).length > 0 : false;

  const hasProfileExtras =
    efpFollowers !== null || efpFollowing !== null || hasSocials;

  // Compact, dot-separated metadata line shown under the name in profile mode:
  // "5.4K followers · 10 following · EOA · Individual · 0x…".
  const formatEntityType = (value: string) =>
    ["cex", "dex"].includes(value.toLowerCase())
      ? value.toUpperCase()
      : value.charAt(0).toUpperCase() + value.slice(1);

  const contractLabel = getContractLabel();
  const efpProfileUrl = address ? `https://efp.app/${address}` : undefined;
  type MetaItem = { text: string; emphasis: boolean; href?: string };
  const metaItems: MetaItem[] = hasProfileExtras
    ? [
        efpFollowers !== null
          ? {
              text: `${formatNumberUserReadable(efpFollowers, 1)} followers`,
              emphasis: true,
              href: efpProfileUrl,
            }
          : null,
        efpFollowing !== null
          ? {
              text: `${formatNumberUserReadable(efpFollowing, 1)} following`,
              emphasis: true,
              href: efpProfileUrl,
            }
          : null,
        contractLabel ? { text: contractLabel, emphasis: false } : null,
        arkham?.entityType
          ? { text: formatEntityType(arkham.entityType), emphasis: false }
          : null,
        address ? { text: formatAddress(address), emphasis: false } : null,
      ].filter((item): item is MetaItem => item !== null)
    : [];

  const visibleMeta =
    maxVisibleTags !== undefined && !tagsExpanded
      ? metaItems.slice(0, maxVisibleTags)
      : metaItems;
  const hiddenMetaCount =
    maxVisibleTags !== undefined && !tagsExpanded
      ? Math.max(0, metaItems.length - maxVisibleTags)
      : 0;

  const nameRow = (
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
            hasProfileExtras && "leading-tight",
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
          className={hasProfileExtras ? "px-1 py-0" : "p-1"}
          iconSize="md"
          customTooltipText={{
            default: "Copy address",
            copied: "Address copied!",
          }}
        />
      )}
      {hasProfileExtras && hasSocials && socials && (
        <EnsSocialLinks socials={socials} iconOnly />
      )}
    </div>
  );

  const metaLine = (
    <div className="text-secondary flex min-w-0 items-center gap-1.5 text-xs">
      {visibleMeta.map((item, index) => (
        <Fragment key={item.text}>
          {index > 0 && <span className="text-dimmed">·</span>}
          {item.href ? (
            <Link
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "whitespace-nowrap transition-opacity hover:opacity-80",
                item.emphasis && "text-primary font-medium",
              )}
            >
              {item.text}
            </Link>
          ) : (
            <span
              className={cn(
                "whitespace-nowrap",
                item.emphasis && "text-primary font-medium",
              )}
            >
              {item.text}
            </span>
          )}
        </Fragment>
      ))}
      {hiddenMetaCount > 0 && (
        <>
          <span className="text-dimmed">·</span>
          <button
            type="button"
            onClick={() => setTagsExpanded(true)}
            className="text-secondary hover:text-primary cursor-pointer whitespace-nowrap"
            aria-label={`Show ${hiddenMetaCount} more`}
          >
            +{hiddenMetaCount}
          </button>
        </>
      )}
    </div>
  );

  const avatarWithName = (
    <div
      className={cn(
        "flex min-w-0 items-center",
        hasProfileExtras ? "gap-3" : "gap-2",
        containerClassName,
      )}
    >
      {avatarElement()}

      <div
        className={cn(
          "flex min-w-0 flex-col",
          hasProfileExtras ? "gap-2" : "gap-0.5",
        )}
      >
        {nameRow}

        {hasProfileExtras
          ? metaItems.length > 0 && metaLine
          : showTags && (
              <div className="flex flex-wrap items-center gap-1">
                {isLoading ? (
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
                  <>
                    {tags.map((tag) => (
                      <BadgeStatus key={tag} variant="secondary">
                        {tag}
                      </BadgeStatus>
                    ))}
                    {hiddenTagsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setTagsExpanded(true)}
                        className="flex cursor-pointer items-center gap-0.5"
                        aria-label={`Show ${hiddenTagsCount} more tags`}
                      >
                        <BadgeStatus variant="secondary">
                          +{hiddenTagsCount}
                        </BadgeStatus>
                      </button>
                    )}
                  </>
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
            arkhamData={arkham}
            ens={ens}
            isContract={isContract}
            isLoading={isLoading}
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
