"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export const TheCardChartLayout = ({
  title,
  headerComponent,
  children,
}: {
  title: string;
  headerComponent: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Card className="flex flex-col rounded-lg border border-lightDark bg-dark shadow sm:max-w-full xl4k:max-w-full">
      <CardHeader className="flex flex-col justify-between rounded-t-lg px-4 py-3 md:flex-row">
        <CardTitle className="flex items-center gap-2.5 text-sm font-medium leading-normal text-[#fafafa]">
          {title}
        </CardTitle>
        {headerComponent}
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col px-4 pb-4 lg:flex-row">
        {children}
      </CardContent>
    </Card>
  );
};
