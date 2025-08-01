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
    <Card className="sm:bg-surface-default xl4k:max-w-full w-full! flex flex-col border-none sm:max-w-full">
      <CardHeader id="daoinfo-basecard-header" className="py-2! px-0 sm:p-2">
        <div
          className={cn(
            "flex w-full items-center",
            data.optionalHeaderValue ? "justify-between" : "justify-start",
          )}
        >
          <CardTitle className="!text-alternative-sm text-primary flex items-center gap-2 font-mono !font-medium uppercase !tracking-wide">
            <div>{data.icon}</div>
            {data.title}
            {data.optionalHeaderValue && (
              <>
                <div className="hidden size-1 rounded-full bg-gray-600 sm:flex" />
                {data.optionalHeaderValue}
              </>
            )}
          </CardTitle>
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
