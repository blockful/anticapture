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
    <Card className="sm:border-light-dark sm:bg-dark xl4k:max-w-full flex flex-col gap-4 rounded-lg border-none sm:max-w-full sm:gap-0 sm:border sm:shadow-sm">
      <CardContent className="flex h-full w-full flex-col gap-6 p-0">
        {title && (
          <div className="flex h-full w-full flex-col">
            <CardTitle className="!text-alternative-sm flex items-center font-mono font-medium text-white uppercase sm:gap-2.5">
              {title}
            </CardTitle>
            <p className="text-foreground text-sm font-normal">{subtitle}</p>
          </div>
        )}
        {children}
      </CardContent>
      {headerComponent}
    </Card>
  );
};
