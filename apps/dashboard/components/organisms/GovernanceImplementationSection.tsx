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
    >
      <div className="flex flex-wrap gap-4 relative">
        {/* Darkening overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black transition-opacity duration-200 z-10",
            openCardId ? "opacity-50" : "opacity-0 pointer-events-none"
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
