import Image from "next/image";

import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BulletDivider } from "@/shared/components/design-system/section";

interface ProviderNameCellProps {
  name: string;
  iconUrl?: string;
  websiteUrl?: string;
  proposalUrl?: string;
}

export const ProviderNameCell = ({
  name,
  iconUrl,
  websiteUrl,
  proposalUrl,
}: ProviderNameCellProps) => {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="bg-surface-contrast border-border-contrast flex size-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-white">
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={name}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-primary truncate text-sm font-medium">
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          {websiteUrl && (
            <DefaultLink openInNewTab href={websiteUrl}>
              WEBSITE
            </DefaultLink>
          )}
          {proposalUrl && (
            <>
              <BulletDivider />
              <DefaultLink openInNewTab href={proposalUrl}>
                PROPOSAL
              </DefaultLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
