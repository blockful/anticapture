"use client";

import { Building2, Pencil } from "lucide-react";
import { useState } from "react";

import { ServiceProvidersTable } from "@/features/service-providers/components/ServiceProvidersTable";
import { UPDATE_STATUS_URL } from "@/features/service-providers/constants/ens-service-providers";
import { useServiceProvidersData } from "@/features/service-providers/hooks/useServiceProvidersData";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

export const ServiceProvidersSection = () => {
  const { programKeys, programs, getProvidersForProgram, isLoading } =
    useServiceProvidersData();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const activeProgram =
    selectedProgram && programKeys.includes(selectedProgram)
      ? selectedProgram
      : (programKeys[programKeys.length - 1] ?? null);

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
          {programKeys.length > 1 && (
            <PillTabGroup
              tabs={programKeys.map((key) => ({
                label: key,
                value: key,
              }))}
              activeTab={activeProgram ?? ""}
              onTabChange={(value) => setSelectedProgram(value)}
            />
          )}

          {activeProgram && (
            <ServiceProvidersTable
              providers={getProvidersForProgram(activeProgram)}
              program={programs[activeProgram]}
              isLoading={isLoading}
            />
          )}
        </div>
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
