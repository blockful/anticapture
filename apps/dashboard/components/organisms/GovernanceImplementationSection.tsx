"use client";

import daoConstantsByDaoId from "@/lib/dao-constants";
import { TheSectionLayout } from "@/components/atoms";
import { DaoIdEnum } from "@/lib/types/daos";
import { GovernanceImplementationCard } from "@/components/molecules";
import { useState } from "react";
import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Lightbulb } from "lucide-react";
import { GovernanceImplementationField } from "@/lib/dao-constants/types";

export const GovernanceImplementationSection = ({
  daoId,
}: {
  daoId: DaoIdEnum;
}) => {
  const [isOpenCardId, setIsOpenCardId] = useState<string | null>(null);

  if (daoConstantsByDaoId[daoId].inAnalysis) {
    return null;
  }

  const governanceImplementationFields =
    daoConstantsByDaoId[daoId].governanceImplementation?.fields;

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.governanceImplementation.title}
      icon={<Lightbulb className="text-foreground" />}
      description={SECTIONS_CONSTANTS.governanceImplementation.description}
      anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
      className="border-b-2 border-b-white/10 px-4 py-8 sm:px-0 sm:py-0"
    >
      <div className="relative flex flex-wrap gap-4">
        <div
          className={cn(
            "absolute inset-0 z-10 bg-black transition-opacity duration-200",
            isOpenCardId ? "opacity-50" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsOpenCardId(null)}
        />

        {governanceImplementationFields?.map(
          (field: GovernanceImplementationField, index: number) => {
            const cardId = field.name;
            const isOpen = isOpenCardId === cardId;

            return (
              <GovernanceImplementationCard
                key={index}
                field={field}
                isOpen={isOpen}
                onToggle={(e) => {
                  e.stopPropagation();
                  setIsOpenCardId(isOpen ? null : cardId);
                }}
              />
            );
          },
        )}
      </div>
    </TheSectionLayout>
  );
};
