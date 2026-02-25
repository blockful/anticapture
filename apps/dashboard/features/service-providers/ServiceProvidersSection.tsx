"use client";

import { Building2, Pencil } from "lucide-react";
import { useState } from "react";

import { CsvExportButton } from "@/features/service-providers/components/CsvExportButton";
import { ServiceProvidersTable } from "@/features/service-providers/components/ServiceProvidersTable";
import { ENS_SERVICE_PROVIDERS } from "@/features/service-providers/data/ens-service-providers";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { cn } from "@/shared/utils";

const AVAILABLE_YEARS = [2026, 2025];

const UPDATE_STATUS_URL = "https://github.com/blockful-io/anticapture/pulls";

export const ServiceProvidersSection = () => {
  const currentYear = new Date().getFullYear();
  const defaultYear = AVAILABLE_YEARS.includes(currentYear)
    ? currentYear
    : AVAILABLE_YEARS[0];
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.serviceProviders.title}
      icon={<Building2 className="section-layout-icon" />}
      description={PAGES_CONSTANTS.serviceProviders.description ?? ""}
      headerAction={
        <a href={UPDATE_STATUS_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="md">
            <Pencil className="size-3.5" />
            Update report status
          </Button>
        </a>
      }
    >
      <SubSectionsContainer>
        <InlineAlert
          text="Report status updates are made via GitHub pull requests and must include a link to the published DAO forum post."
          variant="info"
        />

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {AVAILABLE_YEARS.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "border-1 cursor-pointer px-3 py-2 font-mono text-[13px] font-medium uppercase leading-5 tracking-[0.78px] transition-all duration-300",
                  selectedYear === year
                    ? "border-orange-400 bg-transparent text-orange-400"
                    : "border-[#3F3F46] bg-transparent text-[#A1A1AA] hover:bg-[#27272A]",
                )}
              >
                {year}
              </button>
            ))}
          </div>

          <ServiceProvidersTable
            providers={ENS_SERVICE_PROVIDERS}
            year={selectedYear}
          />

          <CsvExportButton
            providers={ENS_SERVICE_PROVIDERS}
            year={selectedYear}
          />
        </div>
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
