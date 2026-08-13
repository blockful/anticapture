import { ChevronRight } from "lucide-react";

import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";
import { mockedLatestFinding } from "@/shared/constants/mocked-data/mocked-latest-finding";

export const LatestFindingTicker = () => {
  const { finding, caseUrl } = mockedLatestFinding;

  return (
    <div className="bg-surface-default flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:gap-3.5">
      <div className="flex flex-1 flex-col gap-1 lg:flex-row lg:items-center lg:gap-3.5">
        <h2 className="text-primary text-alternative-sm shrink-0 font-mono font-medium uppercase leading-5 tracking-[0.78px]">
          Latest finding
        </h2>
        <p className="text-secondary text-sm font-normal leading-5">
          {finding}
        </p>
      </div>
      <DefaultLink href={caseUrl} variant="highlight" size="sm" openInNewTab>
        Read the case
        <ChevronRight className="size-4" />
      </DefaultLink>
    </div>
  );
};
