"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Skeleton = () => {
  return (
    <Card className="flex flex-col rounded-lg border border-lightDark bg-dark shadow sm:max-w-full xl4k:max-w-full">
      <CardHeader className="rounded-t-lg border-b border-lightDark p-3">
        <CardTitle className="flex items-center gap-2.5 text-base font-normal leading-normal">
          <div className="skeleton-icon h-6 w-6" />
          <div className="skeleton-text h-6 w-1/4" />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex w-full flex-col gap-6 p-3 lg:flex-row">
        {[1, 2].map((_, index) => (
          <div key={index} className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <div className="skeleton-text h-5 w-1/3" />
              <div className="skeleton-icon h-4 w-4" />
            </div>

            <div className="flex h-full w-full gap-2">
              {[1, 2].map((_, idx) => (
                <div key={idx} className="skeleton-text h-8 w-1/2 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
