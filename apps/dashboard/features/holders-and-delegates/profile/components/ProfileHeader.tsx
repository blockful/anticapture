"use client";

import { useGetAddress } from "@anticapture/client/hooks";
import { ExternalLink } from "lucide-react";
import type { Address } from "viem";

import { DelegateButton } from "@/features/holders-and-delegates/delegate/DelegateButton";
import { ShareProfileButton } from "@/features/holders-and-delegates/profile/components/ShareProfileButton";
import { Button } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ReportPanelButton } from "@/shared/components/report/ReportPanelButton";
import {
  ADDRESS_ENRICHMENT_GC_TIME,
  ADDRESS_ENRICHMENT_STALE_TIME,
} from "@/shared/constants/api";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatAddress } from "@/shared/utils/formatAddress";

type ProfileHeaderProps = {
  daoId: DaoIdEnum;
  address: Address;
  /** Label of the panel the report button refers to (the open tab). */
  reportPanel: string;
};

export const ProfileHeader = ({
  daoId,
  address,
  reportPanel,
}: ProfileHeaderProps) => {
  // Same query key as the avatar's own lookup, so this reads from its cache.
  const { data: enrichment } = useGetAddress(address, {
    query: {
      staleTime: ADDRESS_ENRICHMENT_STALE_TIME,
      gcTime: ADDRESS_ENRICHMENT_GC_TIME,
    },
  });
  const ensName = enrichment?.ens?.name ?? null;
  const hasDisplayName = Boolean(
    ensName || enrichment?.arkham?.entity || enrichment?.arkham?.label,
  );

  const daoConfig = daoConfigByDaoId[daoId];
  const explorerUrl = daoConfig.daoOverview.chain.blockExplorers?.default.url;

  const avatarProps = {
    address,
    variant: "rounded" as const,
    showTags: true,
    showEfpStats: true,
    showSocials: true,
    // Without a name the avatar shows the address itself, so it carries the
    // copy button; with one, the full address gets its own line below.
    showFullAddress: !hasDisplayName,
    showCopyAddress: !hasDisplayName,
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="hidden lg:block">
          <EnsAvatar {...avatarProps} size="lg" containerClassName="gap-4" />
        </div>
        <div className="lg:hidden">
          <EnsAvatar
            {...avatarProps}
            size="md"
            containerClassName="gap-3"
            maxVisibleTags={3}
          />
        </div>
        {hasDisplayName && (
          <div className="text-secondary flex min-w-0 items-center gap-1 font-mono text-xs">
            <span className="break-all">{address}</span>
            <CopyAndPasteButton
              textToCopy={address}
              className="p-1"
              iconSize="md"
              customTooltipText={{
                default: "Copy address",
                copied: "Address copied!",
              }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DelegateButton delegateAddress={address} daoId={daoId} size="md" />
        {explorerUrl && (
          <Button asChild variant="outline" size="md">
            <a
              href={`${explorerUrl}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" />
              Explorer
            </a>
          </Button>
        )}
        <ShareProfileButton
          title={`${ensName ?? formatAddress(address)} · ${daoConfig.name}`}
        />
        <ReportPanelButton panel={reportPanel} subject={address} />
      </div>
    </div>
  );
};
