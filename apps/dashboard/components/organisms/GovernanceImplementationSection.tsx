import daoConstantsByDaoId from "@/lib/dao-constants";
import { TheSectionLayout } from "@/components/atoms";
import { DaoIdEnum } from "@/lib/types/daos";
import { GovernanceImplementationCard } from "@/components/molecules/GovernanceImplementationCard";
import { useState } from "react";
import { cn } from "@/lib/client/utils";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { Lightbulb } from "lucide-react";

export const GovernanceImplementationSection = ({
  daoId,
}: {
  daoId: DaoIdEnum;
}) => {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

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
            openCardId ? "opacity-50" : "pointer-events-none opacity-0",
          )}
          onClick={() => setOpenCardId(null)}
        />

        {governanceImplementationFields?.map((field) => {
          const cardId = field.name;
          const isOpen = openCardId === cardId;

          return (
            <GovernanceImplementationCard
              key={cardId}
              title={field.name}
              value={field.value || ""}
              description={field.description}
              riskLevel={field.riskLevel}
              isOpen={isOpen}
              onToggle={(e) => {
                e.stopPropagation();
                setOpenCardId(isOpen ? null : cardId);
              }}
            />
          );
        })}
      </div>
    </TheSectionLayout>
  );
};
