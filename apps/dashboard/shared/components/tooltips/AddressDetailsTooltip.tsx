"use client";

import { ReactNode } from "react";
import { Address } from "viem";

import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { ArkhamDataResult } from "@/shared/hooks/graphql-client/useArkhamData";
import { cn } from "@/shared/utils/cn";
import { formatAddress } from "@/shared/utils/formatAddress";

const UPPERCASE_ENTITY_TYPES = new Set(["cex", "dex"]);

interface AddressDetailsTooltipProps extends Pick<
  ArkhamDataResult,
  "arkhamData" | "ens" | "isContract" | "isLoading"
> {
  address: Address;
  children: ReactNode;
}

const DashedDivider = () => {
  return (
    <div className="border-border-contrast w-full border-t border-dashed" />
  );
};

const Row = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-secondary text-xs font-medium leading-4">
        {label}
      </span>
      {children}
    </div>
  );
};

const SkeletonLine = ({ className }: { className?: string }) => {
  return (
    <div className={cn("bg-surface-hover animate-pulse rounded", className)} />
  );
};

const formatEntityType = (type: string) => {
  return UPPERCASE_ENTITY_TYPES.has(type.toLowerCase())
    ? type.toUpperCase()
    : type;
};

const NotInformed = () => {
  return <span className="text-secondary text-sm leading-5">Not informed</span>;
};

export const AddressDetailsTooltip = ({
  address,
  arkhamData: arkham,
  ens,
  isContract,
  isLoading,
  children,
}: AddressDetailsTooltipProps) => {
  const content = (
    <div className="flex w-full flex-col gap-2">
      <Row label="ENS address">
        {isLoading ? (
          <SkeletonLine className="mt-1 h-5 w-24" />
        ) : ens?.name ? (
          <span className="text-primary text-sm leading-5">{ens.name}</span>
        ) : (
          <NotInformed />
        )}
      </Row>

      <DashedDivider />

      <Row label="Arkham Entity">
        {isLoading ? (
          <SkeletonLine className="mt-1 h-5 w-32" />
        ) : arkham?.entity ? (
          <span className="text-primary text-sm leading-5">
            {arkham.entity}
          </span>
        ) : (
          <NotInformed />
        )}
      </Row>

      <DashedDivider />

      <Row label="Arkham Label">
        {isLoading ? (
          <SkeletonLine className="mt-1 h-5 w-32" />
        ) : arkham?.label ? (
          <span className="text-primary text-sm leading-5">{arkham.label}</span>
        ) : (
          <NotInformed />
        )}
      </Row>

      <DashedDivider />

      <Row label="Wallet address">
        <span className="text-primary text-sm leading-5">
          {formatAddress(address)}
        </span>
      </Row>

      <DashedDivider />

      <Row label="Main Tag/Type" className="gap-1">
        {isLoading ? (
          <div className="flex gap-1">
            <SkeletonLine className="h-5 w-16 rounded-full" />
            <SkeletonLine className="h-5 w-10 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {arkham?.entityType ? (
              <BadgeStatus variant="secondary">
                {formatEntityType(arkham.entityType)}
              </BadgeStatus>
            ) : (
              <NotInformed />
            )}
            <BadgeStatus variant="secondary">
              {isContract ? "Contract" : "EOA"}
            </BadgeStatus>
          </div>
        )}
      </Row>
    </div>
  );

  return (
    <Tooltip
      tooltipContent={content}
      className="w-70 rounded-none p-2 text-left"
    >
      {children}
    </Tooltip>
  );
};
