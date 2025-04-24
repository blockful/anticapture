"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface TheCardChartLayoutProps {
  children: ReactNode;
  headerComponent?: ReactNode;
}

export const TheCardChartLayout = ({
  children,
  headerComponent,
}: TheCardChartLayoutProps) => {
  return (
    <Card className="flex flex-col gap-4 rounded-lg border-none sm:max-w-full sm:gap-0 sm:border sm:border-lightDark sm:bg-dark sm:shadow xl4k:max-w-full">
      <CardContent className="flex h-full w-full flex-col p-0 sm:p-4 lg:flex-row">
        {children}
      </CardContent>
      {headerComponent}
    </Card>
  );
};
