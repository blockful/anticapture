"use client";

import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { ReactNode } from "react";

interface TheCardChartLayoutProps {
  children: ReactNode;
  headerComponent?: ReactNode;
  title?: string;
  subtitle?: string;
}

export const TheCardChartLayout = ({
  title,
  subtitle,
  children,
  headerComponent,
}: TheCardChartLayoutProps) => {
  return (
    <Card className="flex flex-col gap-4 rounded-lg border-none sm:max-w-full sm:gap-0 sm:border sm:border-lightDark sm:bg-dark sm:shadow xl4k:max-w-full">
      <CardContent className="flex h-full w-full flex-col gap-6 p-0">
        {title && (
          <div className="flex h-full w-full flex-col">
            <CardTitle className="flex items-center font-mono text-[13px] font-medium uppercase leading-[18px] text-[#fafafa] sm:gap-2.5">
              {title}
            </CardTitle>
            <p className="text-sm font-normal text-foreground">{subtitle}</p>
          </div>
        )}
        {children}
      </CardContent>
      {headerComponent}
    </Card>
  );
};
