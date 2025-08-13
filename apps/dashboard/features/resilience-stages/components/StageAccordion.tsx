"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { CheckCircle, MinusIcon } from "lucide-react";
import { ReactNode } from "react";
import { Stage } from "@/shared/types/enums/Stage";
import { StageTagSimplified } from "@/shared/components/tags/StageTagSimplified";
import { cn } from "@/shared/utils/";
import { formatPlural } from "@/shared/utils/formatPlural";
import { StageContent } from "@/features/resilience-stages/components/StageContent";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { RiskLevel } from "@/shared/types/enums";
import { Plus } from "lucide-react";
import { DotFilledIcon } from "@radix-ui/react-icons";

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
        riskFields={[]}
        isCompleted={daoStage !== Stage.NONE}
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
              <div className="flex flex-col gap-2">
                <p className="text-primary flex items-start gap-2 text-sm font-normal">
                  {daoStage !== Stage.NONE && (
                    <CheckCircle className="text-success" size={14} />
                  )}
                  All DAOs that have an autonomous operation on-chain based on a
                  governor and timelock are considered at least Stage 0.
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-row gap-2">
                    <div>
                      <DotFilledIcon className="size-4 text-zinc-600" />
                    </div>
                    <p className="text-secondary text-sm font-normal">
                      At this stage, critical risks might still be present and
                      require attention.
                    </p>
                  </div>
                </div>
              </div>
            }
          />
        }
      />
      <CustomAccordionItem
        riskFields={highRiskFields}
        isCompleted={daoStage === Stage.ONE || daoStage === Stage.TWO}
        stage={Stage.ONE}
        title="Partial Risk Reduction"
        description="No High Risk issues, at least one Medium Risk issue remains"
        subtitle="2 issues needs fixing"
      />
      <CustomAccordionItem
        riskFields={mediumRiskFields}
        isCompleted={daoStage === Stage.TWO}
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
  content?: ReactNode;
  isLastItem?: boolean;
}

const stageTwoEmptyContent: (GovernanceImplementationField & {
  name: string;
})[] = [
  {
    name: "This Governance has solved all issues identified as High Risk and met the requirements for Stage 1 qualification.",
    value: "no",
    description:
      "This does not guarantee safety, but it shows the DAO has its security basics in place. Check the dependencies left for Stage 2 to keep advancing towards resilient governance!",
    riskLevel: RiskLevel.LOW,
  },
];

const CustomAccordionItem = ({
  isCompleted,
  riskFields,
  stage,
  description,
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
            "group flex w-full cursor-pointer items-center justify-between transition-all duration-300 ease-in-out",
          )}
        >
          <div className="flex w-full items-center gap-2">
            <StageTagSimplified stage={stage} isCompleted={isCompleted} />
            {riskFields.length > 0 && (
              <div className="flex flex-row items-center gap-2">
                <div className="bg-middle-dark size-1 rounded-full" />
                <p className="text-sm font-normal text-white">
                  {`${formatPlural(riskFields.length, "issue")} needs fixing`}
                </p>
              </div>
            )}
          </div>
          <Plus className="text-secondary size-4 transition-all duration-300 ease-in-out group-data-[state=open]:hidden" />
          <MinusIcon className="text-secondary hidden size-4 transition-all duration-300 ease-in-out group-data-[state=open]:block" />
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
              isCompleted={isCompleted}
              stage={stage}
              title={
                stage === Stage.ONE ? "Partial Risk Reduction" : "Minimal Risks"
              }
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
          <div className="border-light-dark h-px w-full border-b transition-opacity duration-300 ease-in-out" />
        )}
      </>
    </AccordionItem>
  );
};
