"use client";

import { ArrowRightIcon, Globe } from "lucide-react";
import { Card } from "@/shared/components/ui/card";

export const ReachOutToUsCard = () => {
  return (
    <Card
      className="border-light-dark bg-dark hover:bg-tangerine/15 xl4k:max-w-full flex w-full rounded-lg border px-3 py-3 shadow-sm hover:cursor-pointer sm:w-[calc(50%-10px)] md:px-4"
      onClick={() => {
        window.open(
          "https://tally.so/r/nrvGbv",
          "_blank",
          "noopener,noreferrer",
        );
      }}
    >
      <div className="flex w-full justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="border-middle-dark bg-light-dark flex size-9 items-center justify-center rounded-full border sm:size-6">
              <Globe className="text-foreground/70 size-4" />
            </div>
            <div className="flex flex-col justify-start lg:flex-row lg:items-center lg:gap-1.5">
              <h3 className="text-sm font-medium text-white">
                Don&apos;t see your DAO here?
              </h3>
              <div className="flex h-full items-center gap-1">
                <h3 className="link-tangerine uppercase">Reach out to us</h3>
                <ArrowRightIcon className="text-tangerine size-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
