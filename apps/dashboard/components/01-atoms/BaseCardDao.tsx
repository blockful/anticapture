"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Badge,
  CircleCheckIcon,
  CircleNotCheckedIcon,
  TooltipInfo,
} from "@/components/01-atoms";
import { cn } from "@/lib/client/utils";

interface CardItem {
  type: "button" | "text" | "badge" | "switch";
  label?: string;
  icon?: ReactNode;
  value?: string | number;
  onClick?: () => void;
  externalLink?: string;
  switched?: boolean;
  inverted?: boolean;
}

interface CardSection {
  title: string;
  tooltip?: string;
  items: CardItem[];
}

export interface CardData {
  title: string;
  icon: ReactNode;
  sections: CardSection[];
}

interface BaseCardDaoProps {
  data: CardData;
}

export const BaseCardDao = ({ data }: BaseCardDaoProps) => {
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
              {section.items.map((item, index) => {
                switch (item.type) {
                  case "button":
                    return (
                      <button
                        key={index}
                        className="flex h-full w-full"
                        onClick={item.onClick}
                      >
                        <Badge className="flex h-full w-full gap-1 hover:border-lightDark hover:bg-transparent">
                          {item.inverted ? (
                            <>
                              <p className="text-sm font-medium leading-tight">
                                {item.label}
                              </p>
                              {item.icon}
                            </>
                          ) : (
                            <>
                              {item.icon}
                              <p className="text-sm font-medium leading-tight">
                                {item.label}
                              </p>
                            </>
                          )}
                        </Badge>
                      </button>
                    );

                  case "text":
                    return (
                      <p
                        key={index}
                        className="flex h-full w-full text-sm font-medium leading-tight"
                      >
                        {item.label} {item.value}
                      </p>
                    );

                  case "badge":
                    return (
                      <Badge key={index} className="flex h-full w-full">
                        <div className="flex">{item.icon}</div>
                        <p className="flex whitespace-nowrap text-sm font-medium leading-tight">
                          {item.label}
                        </p>
                      </Badge>
                    );

                  case "switch":
                    return (
                      <Badge
                        key={index}
                        className={cn("flex h-full w-full bg-opacity-20", [
                          item.switched ? "bg-[#4ADE80]" : "bg-[#F87171]",
                        ])}
                      >
                        {item.switched ? (
                          <CircleCheckIcon className="text-[#4ADE80]" />
                        ) : (
                          <CircleNotCheckedIcon className="text-[#F87171]" />
                        )}
                        <p
                          className={cn([
                            "text-sm font-medium leading-tight",
                            item.switched ? "text-[#4ADE80]" : "text-[#F87171]",
                          ])}
                        >
                          {item.switched ? "Yes" : "No"}
                        </p>
                      </Badge>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
