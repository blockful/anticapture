"use client";

import { ArrowRightIcon } from "lucide-react";
import { SimpleGlobeIcon } from "@/components/atoms";
import { Card } from "@/components/ui/card";

export const ReachOutToUsCard = () => {
  return (
    <Card
      className="flex w-full flex-row rounded-lg border border-lightDark bg-dark px-4 py-5 shadow hover:cursor-pointer hover:bg-brandOrange/15 xl4k:max-w-full"
      onClick={() => {
        window.open("https://tally.so/r/nrvGbv", "_blank");
      }}
    >
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lightDark">
              <SimpleGlobeIcon className="h-4 w-4 text-foreground" />
            </div>
            <h3 className="text-md font-small pl-1 text-white">
              Don&apos;t see your DAO here?
            </h3>
            <div className="flex items-center gap-1">
              <h3 className="text-md font-small text-brandOrange">
                Reach out to us
              </h3>
              <ArrowRightIcon className="h-4 w-4 pl-0 text-brandOrange" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
