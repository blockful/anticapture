"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TooltipInfo } from "@/components/atoms";
import { cn } from "@/lib/client/utils";

export interface CardSection {
  title: string;
  tooltip?: string;
  items: ReactNode[];
}

export interface CardData {
  title: string;
  icon: ReactNode;
  optionalHeaderValue?: ReactNode;
  sections: CardSection[];
}

interface BaseCardDaoInfoProps {
  data: CardData;
}

export const BaseCardDaoInfo = ({ data }: BaseCardDaoInfoProps) => {
  return (
    <Card className="flex !w-full flex-col border-none bg-dark sm:max-w-full xl4k:max-w-full">
      <CardHeader id="daoinfo-basecard-header" className="py-2 sm:p-2">
        <div
          className={cn(
            "flex w-full items-center",
            data.optionalHeaderValue ? "justify-between" : "justify-start",
          )}
        >
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase text-[#FAFAFA]">
            {data.icon}
            {data.title}
          </CardTitle>
          {data.optionalHeaderValue}
        </div>
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col gap-5 p-2">
        {data.sections.map((section, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <h1 className="text-foreground">{section.title}</h1>
              {section.tooltip && <TooltipInfo text={section.tooltip} />}
            </div>

            <div className="flex h-full w-full gap-2">
              {section.items.map((item, index) => (
                <div key={index} className="flex">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
