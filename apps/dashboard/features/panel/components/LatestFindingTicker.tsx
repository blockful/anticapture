import { ChevronRight } from "lucide-react";

import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";
import { getLatestParagraphPost } from "@/shared/services/paragraph/latestPost";

export const LatestFindingTicker = async () => {
  const { title: finding, url: caseUrl } = await getLatestParagraphPost();

  return (
    <div className="bg-surface-default flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:gap-3.5">
      <div className="flex flex-1 flex-col gap-1 lg:min-w-0 lg:flex-row lg:items-center lg:gap-3.5">
        <h2 className="text-primary text-alternative-sm tracking-alternative-sm shrink-0 font-mono font-medium uppercase leading-5">
          Latest finding
        </h2>
        {/* Post titles come from the feed and run long; the design draws this
         * strip as a single line on desktop, and wraps it on mobile. */}
        <p className="text-secondary text-sm font-normal leading-5 lg:min-w-0 lg:truncate">
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
