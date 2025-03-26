"use client";

import { ArrowRightIcon } from "lucide-react";
import { SimpleGlobeIcon } from "@/components/atoms";
import { Card } from "@/components/ui/card";

export const ReachOutToUsCard = () => {
  return (
    <Card
      className="flex w-full rounded-lg border border-lightDark bg-dark px-3 md:px-4 md:py-5 py-3 shadow hover:cursor-pointer hover:bg-tangerine/15 xl4k:max-w-full"
      onClick={() => {
        window.open("https://tally.so/r/nrvGbv", "_blank", "noopener,noreferrer");
      }}
    >
      <div className="flex w-full justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lightDark">
              <SimpleGlobeIcon className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex flex-col md:flex-row items-start justify-start gap-0 md:gap-2 pl-3 md:pl-0">
              <h3 className="md:text-md text-sm font-small md:pl-1 pl-0 text-white ">
                Don&apos;t see your DAO here?
              </h3>
              <div className="flex items-center gap-1">
                <h3 className="md:text-md text-sm font-small text-tangerine">
                  Reach out to us
                </h3>
                <ArrowRightIcon className="h-4 w-4 pl-0 text-tangerine" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
