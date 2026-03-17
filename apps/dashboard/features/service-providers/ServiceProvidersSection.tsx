"use client";

import { Building2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { ServiceProvidersTable } from "@/features/service-providers/components/ServiceProvidersTable";
import { useServiceProvidersData } from "@/features/service-providers/hooks/useServiceProvidersData";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

const UPDATE_STATUS_URL =
  "https://github.com/blockful/spp-accountability/pulls";

export const ServiceProvidersSection = () => {
  const { data: providers = [], isLoading } = useServiceProvidersData();

  const availableYears = [
    ...new Set(providers.flatMap((p) => Object.keys(p.years).map(Number))),
  ].sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (selectedYear === undefined && availableYears.length > 0) {
      const year = availableYears.includes(currentYear)
        ? currentYear
        : availableYears[0];
      setSelectedYear(year);
    }
  }, [availableYears, currentYear, selectedYear]);

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.serviceProviders.title}
      icon={<Building2 className="section-layout-icon" />}
      description={PAGES_CONSTANTS.serviceProviders.description ?? ""}
      headerAction={
        <a href={UPDATE_STATUS_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="primary" size="md" className="whitespace-nowrap">
            <Pencil className="size-3.5" />
            Update report status
          </Button>
        </a>
      }
    >
      <InlineAlert
        text="Report status updates are made via GitHub pull requests and must include a link to the published DAO forum post."
        variant="info"
      />
      <SubSectionsContainer>
        <div className="flex flex-col gap-4">
          <PillTabGroup
            tabs={availableYears.map((year) => ({
              label: String(year),
              value: String(year),
            }))}
            activeTab={String(selectedYear)}
            onTabChange={(value) => setSelectedYear(Number(value))}
          />

          <ServiceProvidersTable
            providers={providers}
            year={selectedYear ?? currentYear}
            isLoading={isLoading}
          />
        </div>
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
