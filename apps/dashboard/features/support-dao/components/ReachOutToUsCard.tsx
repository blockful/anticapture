"use client";

import { ChevronRight, Globe } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";

export const ReachOutToUsCard = () => {
  return (
    <Card className="flex w-full rounded-lg border border-lightDark bg-dark px-3 py-3 shadow sm:w-[calc(50%-10px)] md:px-4 xl4k:max-w-full">
      <div className="flex w-full justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full border border-middleDark bg-lightDark sm:size-6">
              <Globe className="size-4 text-foreground text-opacity-70" />
            </div>
            <div className="flex flex-col justify-start lg:flex-row lg:items-center lg:gap-1.5">
              <h3 className="text-sm font-medium text-white">
                Don&apos;t see your DAO here?
              </h3>

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
