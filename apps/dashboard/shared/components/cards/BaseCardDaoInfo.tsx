"use client";

import { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";
import { TooltipInfo } from "@/shared/components/tooltips/TooltipInfo";
import { cn } from "@/shared/utils/";

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
    <Card className="sm:bg-surface-default xl4k:max-w-full flex w-full! flex-col border-none sm:max-w-full">
      <CardHeader id="daoinfo-basecard-header" className="px-0 py-2! sm:p-2">
        <div
          className={cn(
            "flex w-full items-center",
            data.optionalHeaderValue ? "justify-between" : "justify-start",
          )}
        >
          <CardTitle className="text-primary flex items-center gap-2 text-xs font-semibold uppercase">
            {data.icon}
            {data.title}
          </CardTitle>
          {data.optionalHeaderValue}
        </div>
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col gap-4 p-0 sm:gap-5 sm:p-2">
        {data.sections.map((section, index) => (
          <div key={index} className="flex justify-between gap-2 sm:flex-col">
            <div className="flex w-full items-center gap-1.5">
              <p className="text-secondary text-sm font-normal">
                {section.title}
              </p>
              {section.tooltip && <TooltipInfo text={section.tooltip} />}
            </div>

            <div className="flex h-full w-full justify-end gap-2 sm:justify-start">
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
