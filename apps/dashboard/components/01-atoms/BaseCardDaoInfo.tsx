"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TooltipInfo } from "@/components/01-atoms";

export interface CardSection {
  title: string;
  tooltip?: string;
  items: ReactNode[];
}

export interface CardData {
  title: string;
  icon: ReactNode;
  sections: CardSection[];
}

interface BaseCardDaoInfoProps {
  data: CardData;
}

export const BaseCardDaoInfo = ({ data }: BaseCardDaoInfoProps) => {
  return (
    <Card className="flex flex-col rounded-lg border border-lightDark bg-dark shadow sm:max-w-full xl4k:max-w-full">
      <CardHeader className="rounded-t-lg border-b border-lightDark p-3">
        <CardTitle className="flex items-center gap-2.5 text-base font-normal leading-normal">
          {data.icon}
          {data.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col gap-6 p-3 lg:flex-row">
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
