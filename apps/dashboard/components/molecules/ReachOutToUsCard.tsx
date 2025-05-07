"use client";

import { ArrowRightIcon } from "lucide-react";
import { SimpleGlobeIcon } from "@/components/atoms";
import { Card } from "@/components/ui/card";

export const ReachOutToUsCard = () => {
  return (
    <Card
      className="flex w-full rounded-lg border border-lightDark bg-dark px-3 py-3 shadow hover:cursor-pointer hover:bg-tangerine/15 sm:w-[calc(50%-10px)] md:px-4 xl4k:max-w-full"
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
          <div className="flex items-center gap-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-lightDark">
              <SimpleGlobeIcon className="size-5 text-foreground" />
            </div>
            <div className="flex flex-col items-start justify-start gap-0 pl-3 md:flex-row md:gap-2 md:pl-0">
              <h3 className="md:text-md font-small pl-0 text-sm text-white md:pl-1">
                Don&apos;t see your DAO here?
              </h3>
              <div className="flex items-center gap-1">
                <h3 className="md:text-md font-small text-sm text-tangerine">
                  Reach out to us
                </h3>
                <ArrowRightIcon className="size-4 pl-0 text-tangerine" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
