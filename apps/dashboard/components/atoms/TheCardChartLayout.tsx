"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";

interface TheCardChartLayoutProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  children: ReactNode;
  headerComponent?: ReactNode;
}

export const TheCardChartLayout = ({
  title,
  description,
  children,
  headerComponent,
}: TheCardChartLayoutProps) => {
  return (
    <Card className="flex flex-col rounded-lg border-none sm:max-w-full sm:border sm:border-lightDark sm:bg-dark sm:shadow xl4k:max-w-full">
      <CardHeader className="flex flex-col justify-between rounded-t-lg px-4 py-3 md:flex-row">
        <div className="flex flex-col">
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium leading-normal text-[#fafafa]">
            {title}
          </CardTitle>
          <CardDescription className="flex text-sm font-normal text-foreground">
            {description}
          </CardDescription>
        </div>
        {headerComponent}
      </CardHeader>

      <CardContent className="flex h-full w-full flex-col px-4 py-4 lg:flex-row">
        {children}
      </CardContent>
    </Card>
  );
};
