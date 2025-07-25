"use client";

import { ChevronRight, Globe } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";

export const ReachOutToUsCard = () => {
  return (
    <Card className="!border-light-dark bg-surface-default flex w-full rounded-lg border px-3 py-3 shadow md:px-4">
      <div className="flex w-full justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="border-middle-dark bg-surface-contrast flex size-9 items-center justify-center rounded-full border sm:size-6">
              <Globe className="text-secondary/70 size-4" />
            </div>
            <div className="flex flex-col justify-start lg:flex-row lg:items-center lg:gap-1.5">
              <p className="text-primary text-sm font-medium">
                Don&apos;t see the DAO you&apos;re in here?
              </p>

              <DefaultLink
                href="https://tally.so/r/nrvGbv"
                openInNewTab
                variant="highlight"
              >
                Reach out to us
                <ChevronRight className="size-4" />
              </DefaultLink>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
