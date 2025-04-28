"use client";

import daoConfigByDaoId from "@/lib/dao-config";
import { TheSectionLayout } from "@/components/atoms";
import { DaoIdEnum } from "@/lib/types/daos";
import { GovernanceImplementationCard } from "@/components/molecules";
import { useState } from "react";
import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Lightbulb } from "lucide-react";
import { GovernanceImplementationField } from "@/lib/dao-config/types";
import { useScreenSize } from "@/lib/hooks/useScreenSize";

export const GovernanceImplementationSection = ({
  daoId,
}: {
  daoId: DaoIdEnum;
}) => {
  const { isDesktop, isTablet } = useScreenSize();
  const [openCardIds, setOpenCardIds] = useState<string[]>([]);

  const governanceImplementationFields =
    daoConfigByDaoId[daoId].governanceImplementation?.fields;

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

        {governanceImplementationFields?.map(
          (field: GovernanceImplementationField, index: number) => {
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
          },
        )}
      </div>
    </TheSectionLayout>
  );
};
