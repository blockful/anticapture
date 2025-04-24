"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";
import { InfoIcon } from "@/components/atoms";

interface TheCardChartLayoutProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  children: ReactNode;
  headerComponent?: ReactNode;
  switchDate?: ReactNode;
}

export const TheCardChartLayout = ({
  title,
  description,
  switchDate,
  children,
  headerComponent,
}: TheCardChartLayoutProps) => {
  return (
    <Card className="flex flex-col gap-4 rounded-lg border-none sm:max-w-full sm:gap-0 sm:border sm:border-lightDark sm:bg-dark sm:shadow xl4k:max-w-full">
      <CardHeader className="flex flex-col gap-4 rounded-t-lg px-0 py-0">
        <div className="flex h-full w-full justify-between">
          <div className="flex flex-col">
            <CardTitle className="font-roboto flex items-center text-[13px] font-medium uppercase leading-[18px] text-[#fafafa] sm:gap-2.5">
              {title}
            </CardTitle>
            <p className="text-sm font-normal text-foreground">
              Jan 03, 2025 - Jan 03, 2025
            </p>
          </div>
          <div className="flex items-center">{switchDate}</div>
        </div>
        {description && (
          <CardDescription className="flex items-center gap-2 rounded-lg bg-lightDark p-2 text-sm font-normal text-foreground">
            <InfoIcon className="text-tangerine" />
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col p-0 sm:p-4 lg:flex-row">
        {children}
      </CardContent>
      {headerComponent}
    </Card>
  );
};
