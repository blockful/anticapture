"use client";

import { ProviderNameCell } from "@/features/service-providers/components/ProviderNameCell";
import { StatusCell } from "@/features/service-providers/components/StatusCell";
import {
  getCurrentQuarter,
  QUARTER_DUE_DATES,
  QuarterKey,
  ServiceProvider,
} from "@/features/service-providers/types";
import { cn } from "@/shared/utils";

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

interface ServiceProvidersTableProps {
  providers: ServiceProvider[];
  year: number;
}

export const ServiceProvidersTable = ({
  providers,
  year,
}: ServiceProvidersTableProps) => {
  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();
  const quarterMeta = QUARTER_DUE_DATES[year] ?? QUARTER_DUE_DATES[currentYear];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border-contrast border-b">
            <th className="text-secondary w-[220px] py-3 pl-4 text-left text-xs font-medium uppercase tracking-wider">
              Name
            </th>
            <th className="text-secondary w-[92px] py-3 pl-4 text-left text-xs font-medium">
              <div className="flex items-center gap-1">
                Budget
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  className="opacity-60"
                >
                  <path d="M6 2L8.5 5H3.5L6 2ZM6 10L3.5 7H8.5L6 10Z" />
                </svg>
              </div>
            </th>
            {QUARTERS.map((quarter) => {
              const isCurrentQuarter =
                year === currentYear && quarter === currentQuarter;
              const meta = quarterMeta[quarter];
              return (
                <th
                  key={quarter}
                  className={cn(
                    "w-[149px] py-3 pl-4 text-left",
                    isCurrentQuarter && "border-b-2 border-orange-400",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-primary text-xs font-medium">
                      {quarter}
                      {isCurrentQuarter && (
                        <span className="text-secondary ml-1 font-normal">
                          (Current)
                        </span>
                      )}
                    </span>
                    <span className="text-secondary text-[10px] font-normal">
                      {meta?.dueDateLabel}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {providers.map((provider, index) => {
            const yearData = provider.years[year];
            if (!yearData) return null;

            return (
              <tr
                key={provider.name}
                className={cn(
                  "border-border-contrast border-b transition-colors",
                  index % 2 === 0 ? "bg-transparent" : "bg-surface-contrast/20",
                  "hover:bg-surface-contrast/40",
                )}
              >
                <td className="py-3 pl-4">
                  <ProviderNameCell
                    name={provider.name}
                    websiteUrl={provider.websiteUrl}
                    proposalUrl={provider.proposalUrl}
                  />
                </td>
                <td className="py-3 pl-4">
                  <span className="text-primary text-sm">
                    {provider.budget}
                  </span>
                </td>
                {QUARTERS.map((quarter) => {
                  const report = yearData[quarter];
                  const isCurrentQuarter =
                    year === currentYear && quarter === currentQuarter;
                  return (
                    <td
                      key={quarter}
                      className={cn(
                        "py-3 pl-4",
                        isCurrentQuarter && "border-b-2 border-orange-400",
                      )}
                    >
                      <StatusCell
                        status={report.status}
                        reportUrl={report.reportUrl}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
