"use client";

import daoConfigByDaoId from "@/shared/dao-config";
import { TheSectionLayout } from "@/shared/components";
import { DaoIdEnum } from "@/lib/types/daos";
import { useState } from "react";
import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Lightbulb } from "lucide-react";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { useScreenSize } from "@/shared/hooks";
import { fieldsToArray } from "@/shared/dao-config/utils";
import { sortByRiskLevel } from "@/shared/types/enums";
import { GovernanceImplementationCard } from "@/features/governance-implementation/components";

export const GovernanceImplementationSection = ({
  daoId,
}: {
  daoId: DaoIdEnum;
}) => {
  const { isDesktop, isTablet } = useScreenSize();
  const [openCardIds, setOpenCardIds] = useState<string[]>([]);

  const governanceImplementationFields = fieldsToArray(
    daoConfigByDaoId[daoId].governanceImplementation?.fields,
  ) as (GovernanceImplementationField & { name: string })[];

  const handleToggle = (
    e: React.MouseEvent<Element, MouseEvent>,
    cardId: string,
    isOpen: boolean,
  ) => {
    if (isDesktop || isTablet) {
      e.stopPropagation();
      if (isOpen) {
        setOpenCardIds([]);
        return;
      }
      setOpenCardIds([cardId]);
      return;
    }

    setOpenCardIds((prev) => {
      if (isOpen) {
        return prev.filter((id) => id !== cardId);
      }
      return [...prev, cardId];
    });
  };
  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.governanceImplementation.title}
      icon={<Lightbulb className="text-foreground" />}
      description={SECTIONS_CONSTANTS.governanceImplementation.description}
      anchorId={SECTIONS_CONSTANTS.governanceImplementation.anchorId}
    >
      <div className="relative flex flex-wrap gap-4">
        <div
          className={cn(
            "absolute inset-0 z-10 transition-all duration-200 ease-in-out sm:bg-black sm:transition-opacity",
            openCardIds.length > 0
              ? "hidden sm:block sm:opacity-50"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => setOpenCardIds([])}
        />

        {governanceImplementationFields
          ?.sort((a, b) => sortByRiskLevel(a, b, "desc"))
          .map((field, index: number) => {
            const cardId = field.name;
            const isOpen = openCardIds.includes(cardId);

            return (
              <GovernanceImplementationCard
                key={index}
                field={field}
                isOpen={isOpen}
                onToggle={(e) => {
                  handleToggle(e, cardId, isOpen);
                }}
              />
            );
          })}
      </div>
    </TheSectionLayout>
  );
};
