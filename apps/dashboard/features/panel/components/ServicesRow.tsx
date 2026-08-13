import { ChevronRight, ShieldCheck } from "lucide-react";

import { BadgeIcon } from "@/shared/components/design-system/badges/badge-icon/BadgeIcon";
import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";
import { BulletDivider } from "@/shared/components/design-system/section/bullet-divider/BulletDivider";

const SERVICES = [
  "Security audits",
  "Calldata review",
  "Front-end package",
  "Consulting & research",
];

export const ServicesRow = () => {
  return (
    <div className="bg-surface-default flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center gap-1.5">
          <BadgeIcon icon={ShieldCheck} variant="dimmed" iconVariant="dimmed" />
          <h2 className="text-primary text-alternative-xs font-mono font-medium uppercase leading-4 tracking-wider">
            Services by Blockful
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-[7px] gap-y-1">
          {SERVICES.map((service, index) => (
            <div key={service} className="flex items-center gap-x-[7px]">
              {index > 0 && <BulletDivider />}
              <span className="text-secondary text-sm font-normal leading-5">
                {service}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DefaultLink
        href="/contact"
        variant="highlight"
        size="sm"
        openInNewTab={false}
      >
        Talk to us
        <ChevronRight className="size-4" />
      </DefaultLink>
    </div>
  );
};
