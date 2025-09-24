"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { DownloadIcon, Info } from "lucide-react";
import { ReactNode } from "react";
import { CSVLink } from "react-csv";
import { Data } from "react-csv/lib/core";

interface TheCardChartLayoutProps {
  children: ReactNode;
  headerComponent?: ReactNode;
  switcherComponent?: ReactNode;
  title?: string;
  subtitle?: string;
  csvData?: Data;
  infoText?: string;
}

export const TheCardChartLayout = ({
  title,
  subtitle,
  children,
  headerComponent,
  csvData,
  switcherComponent,
  infoText,
}: TheCardChartLayoutProps) => {
  return (
    <Card className="sm:border-light-dark sm:bg-surface-default xl4k:max-w-full flex flex-col gap-4 rounded-lg border-none sm:max-w-full sm:gap-0 sm:border">
      <CardContent className="flex h-full w-full flex-col gap-6 p-0">
        {title && (
          <div className="flex h-full w-full items-center">
            <div className="flex h-full w-full flex-col">
              <div className="flex h-full w-full gap-1.5">
                <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium uppercase tracking-wide sm:gap-2.5">
                  {title}
                </CardTitle>
                {csvData && (
                  <CSVLink
                    data={csvData}
                    className="!text-alternative-sm text-primary mb-0.5 flex items-center font-mono font-medium"
                  >
                    [
                    <p className="text-link hover:text-link-hover flex cursor-pointer items-center gap-1">
                      CSV <DownloadIcon className="size-3.5" />
                    </p>
                    ]
                  </CSVLink>
                )}
              </div>
              <p className="text-secondary text-sm font-normal">{subtitle}</p>
            </div>
            {switcherComponent && (
              <div className="flex w-full items-center justify-end">
                {switcherComponent}
              </div>
            )}
          </div>
        )}
        {infoText && (
          <CardDescription className="bg-surface-contrast flex w-full items-start gap-2 rounded-lg p-2 sm:items-center">
            <div className="mt-0.5 sm:mt-0">
              <Info className="text-primary size-4 w-fit" />
            </div>
            <p className="text-secondary text-sm font-normal">{infoText}</p>
          </CardDescription>
        )}
        {children}
      </CardContent>
      {headerComponent}
    </Card>
  );
};
