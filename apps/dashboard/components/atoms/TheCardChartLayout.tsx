"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface TheCardChartLayoutProps {
  title: string | ReactNode;
  children: ReactNode;
  headerComponent?: ReactNode;
}

export const TheCardChartLayout = ({
  title,
  children,
  headerComponent,
}: TheCardChartLayoutProps) => {
  return (
    <Card className="flex flex-col rounded-lg border border-lightDark bg-dark shadow sm:max-w-full xl4k:max-w-full">
      <CardHeader className="flex flex-col justify-between rounded-t-lg px-4 py-3 md:flex-row">
        <CardTitle className="flex items-center gap-2.5 text-sm font-medium leading-normal text-[#fafafa]">
          {title}
        </CardTitle>
        {headerComponent}
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col px-4 py-4 lg:flex-row">
        {children}
      </CardContent>
    </Card>
  );
};
