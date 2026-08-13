import { ChevronRight } from "lucide-react";

import { DaoProtectionLevels } from "@/features/panel/components/DaoProtectionLevels";
import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";

const FRAMEWORK_DOCS_URL =
  "https://blockful.gitbook.io/anticapture/anticapture/framework";

export const PanelHero = () => {
  return (
    <div className="flex flex-col items-stretch gap-2 lg:flex-row">
      <div className="bg-surface-default flex flex-1 flex-col justify-between gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-primary text-h3 font-medium">
            See which DAOs could be captured, and what it would cost an
            attacker.
          </h1>
          <p className="text-secondary text-[15px] font-normal leading-[23px]">
            Live governance-security risk for every DAO we monitor, scored by
            our open Stage framework, showing how exposed each DAO is to hostile
            capture.
          </p>
        </div>
        <DefaultLink
          href={FRAMEWORK_DOCS_URL}
          variant="highlight"
          size="sm"
          openInNewTab
        >
          How the framework works
          <ChevronRight className="size-4" />
        </DefaultLink>
      </div>

      <div className="flex flex-1">
        <DaoProtectionLevels />
      </div>
    </div>
  );
};
