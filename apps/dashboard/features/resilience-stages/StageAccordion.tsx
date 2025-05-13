"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { MinusIcon } from "lucide-react";
import { ReactNode } from "react";
import { PlusIcon } from "@/shared/components/icons";
import { Stage } from "@/features/resilience-stages/StageTag";
import { StageTagSimplified } from "@/shared/components/StageTagSimplified";
import { cn } from "@/lib/client/utils";
import { StageContent } from "@/shared/components/StageContent";
import { GovernanceImplementationField } from "@/lib/dao-config/types";
import { RiskLevel } from "@/lib/enums";

interface StageAccordionProps {
  daoStage: Stage;
  highRiskFields: (GovernanceImplementationField & { name: string })[];
  mediumRiskFields: (GovernanceImplementationField & { name: string })[];
}

export const StageAccordion = ({
  daoStage,
  highRiskFields,
  mediumRiskFields,
}: StageAccordionProps) => {
  return (
    <Accordion type="multiple" className="flex h-full flex-col gap-3">
      <CustomAccordionItem
        key={0}
        riskFields={[]}
        isCompleted={true}
        stage={Stage.ZERO}
        title="Partial Risk Reduction"
        description="No High Risk issues, at least one Medium Risk issue remains"
        subtitle=""
        content={
          <StageContent
            stage={Stage.ZERO}
            title="Critical Vulnerabilities"
            description="At least one High Risk issue identified"
            type="requirements"
            requirementText={
              <>
                <span className="block">
                  All DAOs that have governor and timelock are considered at
                  least{" "}
                  <span className="whitespace-nowrap text-white">Stage 0</span>.
                </span>
                <span className="block pl-1">
                  At this stage, critical risks still be present and require
                  attention.
                </span>
              </>
            }
          />
        }
      />
      <CustomAccordionItem
        key={1}
        riskFields={highRiskFields}
        isCompleted={false}
        stage={Stage.ONE}
        title="Partial Risk Reduction"
        description="No High Risk issues, at least one Medium Risk issue remains"
        subtitle="2 issues needs fixing"
      />
      <CustomAccordionItem
        key={2}
        riskFields={mediumRiskFields}
        isCompleted={false}
        stage={Stage.TWO}
        title="Partial Risk Reduction"
        description="No High or Medium Risk issues, only Low Risk items"
        subtitle="2 issues needs fixing"
        isLastItem={true}
      />
    </Accordion>
  );
};

interface CustomAccordionItemProps {
  isCompleted: boolean;
  riskFields: (GovernanceImplementationField & { name: string })[];
  stage: Stage;
  title: string;
  description: string;
  subtitle: string;
  key: number;
  content?: ReactNode;
  isLastItem?: boolean;
}

const stageTwoEmptyContent: (GovernanceImplementationField & {
  name: string;
})[] = [
  {
    name: "Fix all Stage 1 parameters and reduce their risk level to low",
    value: "no",
    description:
      "To complete this stage, you need to resolve all previous parameters and bring them down to low risk. High Risk issues partially solved will qualify as Medium Risk and stays as blockers for Stage 2 progression.",
    riskLevel: RiskLevel.LOW,
  },
];

const CustomAccordionItem = ({
  key,
  isCompleted,
  riskFields,
  stage,
  title,
  description,
  subtitle,
  content,
  isLastItem = false,
}: CustomAccordionItemProps) => {
  return (
    <AccordionItem
      value={`stage-${stage}`}
      className="flex h-full flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <>
        <AccordionTrigger
          className={cn(
            "group flex w-full items-center justify-between transition-all duration-300 ease-in-out",
          )}
        >
          <div className="flex w-full items-center gap-2">
            <StageTagSimplified stage={stage} isCompleted={isCompleted} />
            {riskFields.length > 0 && (
              <div className="flex flex-row items-center gap-2">
                <div className="size-1 rounded-full bg-middleDark" />
                <p className="text-sm font-normal text-white">
                  {`${riskFields.length} issues needs fixing`}
                </p>
              </div>
            )}
          </div>
          <PlusIcon className="size-4 text-foreground transition-all duration-300 ease-in-out group-data-[state=open]:hidden" />
          <MinusIcon className="hidden size-4 text-foreground transition-all duration-300 ease-in-out group-data-[state=open]:block" />
        </AccordionTrigger>
        {content ? (
          <AccordionContent
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              "data-[state=open]:animate-accordion-down",
              "data-[state=closed]:animate-accordion-up",
            )}
          >
            {content}
          </AccordionContent>
        ) : (
          <AccordionContent
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              "data-[state=open]:animate-accordion-down",
              "data-[state=closed]:animate-accordion-up",
            )}
          >
            <StageContent
              stage={stage}
              title="Minimal Risks"
              description={description}
              type="issues"
              issues={
                riskFields.length > 0
                  ? riskFields.map((field) => ({
                      title: field.name,
                      description: field?.requirements ?? [],
                    }))
                  : stageTwoEmptyContent.map((field) => ({
                      title: field.name,
                      description: [field.description],
                    }))
              }
            />
          </AccordionContent>
        )}
        {!isLastItem && (
          <div className="h-px w-full border-b border-lightDark transition-opacity duration-300 ease-in-out" />
        )}
      </>
    </AccordionItem>
  );
};
