"use client";

import { Building2, Pencil } from "lucide-react";
import { useState } from "react";

import { ServiceProvidersTable } from "@/features/service-providers/components/ServiceProvidersTable";
import { SPP_PROGRAMS } from "@/features/service-providers/constants/ens-service-providers";
import { useServiceProvidersData } from "@/features/service-providers/hooks/useServiceProvidersData";
import type { SPPKey } from "@/features/service-providers/types";
import { TheSectionLayout } from "@/shared/components/containers/TheSectionLayout";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { SubSectionsContainer } from "@/shared/components/design-system/section";
import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";

const UPDATE_STATUS_URL =
  "https://github.com/blockful/spp-accountability/blob/main/README.md";

export const ServiceProvidersSection = () => {
  const { data: providers = [], isLoading } = useServiceProvidersData();
  const [selectedSpp, setSelectedSpp] = useState<SPPKey>("SPP2");

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
            tabs={SPP_PROGRAMS.map((spp) => ({
              label: spp,
              value: spp,
            }))}
            activeTab={selectedSpp}
            onTabChange={(value) => setSelectedSpp(value as SPPKey)}
          />

          <ServiceProvidersTable
            providers={providers}
            spp={selectedSpp}
            isLoading={isLoading}
          />
        </div>
      </SubSectionsContainer>
    </TheSectionLayout>
  );
};
