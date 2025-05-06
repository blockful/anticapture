"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { MinusIcon } from "lucide-react";
import { ReactNode } from "react";
import { PlusIcon } from "@/components/atoms";
import { Stage } from "@/components/atoms/StageTag";
import { StageTagSimplified } from "@/components/atoms/StageTagSimplified";
import { cn } from "@/lib/client/utils";
import { StageContent } from "@/components/atoms/StageContent";

interface AccordionDataProps {
  subtitle: string;
  title: ReactNode;
  content: ReactNode;
}

const AccordionData: AccordionDataProps[] = [
  {
    subtitle: "",
    title: <StageTagSimplified stage={Stage.ZERO} />,
    content: (
      <StageContent
        stage={Stage.ZERO}
        title="Critical Vulnerabilities"
        description="At least one High Risk issue identified"
        type="requirements"
        requirementText={
          <>
            <span className="block">
              All DAOs that have governor and timelock are considered at least{" "}
              <span className="whitespace-nowrap text-white">Stage 0</span>.
            </span>
            <span className="block">
              At this stage, critical risks still be present and require
              attention.
            </span>
          </>
        }
      />
    ),
  },
  {
    subtitle: "2 issues needs fixing",
    title: <StageTagSimplified stage={Stage.ONE} isCompleted={false} />,
    content: (
      <StageContent
        stage={Stage.ONE}
        title="Partial Risk Reduction"
        description="No High Risk issues, at least one Medium Risk issue remains"
        type="issues"
        issues={[
          {
            title: "Voting Period",
            description: [
              "The current voting period of 2 days is too short to allow for aligned delegates to defend the DAO against an attack.",
              "To change this the DAO needs to approve a proposal to change this configuration in the governor contract.",
              "To be qualified as low risk, the Voting Period should be of 7 days or more.",
            ],
          },
          {
            title: "Spam Prevention",
            description: [
              "The DAO currently lacks sufficient protections against proposal spamming, increasing the risk of governance attacks.",
            ],
          },
          {
            title: "Voting Subsidy",
            description: [
              "Without support mechanisms, active participation in governance can decline due to high transaction costs.",
              "To change this, the DAO can implement a voting subsidy to reimburse or reward users who vote on proposals.",
            ],
          },
        ]}
      />
    ),
  },
  {
    subtitle: "3 issue needs fixing",
    title: <StageTagSimplified stage={Stage.TWO} isCompleted={false} />,
    content: (
      <StageContent
        stage={Stage.TWO}
        title="Minimal Risks"
        description="No High Risk issues, at least one Medium Risk issue remains"
        type="issues"
        issues={[
          {
            title: "Voting Period",
            description: [
              "The current voting period of 2 days is too short to allow for aligned delegates to defend the DAO against an attack.",
              "To change this the DAO needs to approve a proposal to change this configuration in the governor contract.",
              "To be qualified as low risk, the Voting Period should be of 7 days or more.",
            ],
          },
          {
            title: "Spam Prevention",
            description: [
              "The DAO currently lacks sufficient protections against proposal spamming, increasing the risk of governance attacks.",
            ],
          },
          {
            title: "Voting Subsidy",
            description: [
              "Without support mechanisms, active participation in governance can decline due to high transaction costs.",
              "To change this, the DAO can implement a voting subsidy to reimburse or reward users who vote on proposals.",
            ],
          },
        ]}
      />
    ),
  },
];

export const StageAccordion = () => {
  return (
    <Accordion type="multiple" className="flex h-full flex-col gap-3">
      {AccordionData.map((item, index) => (
        <AccordionItem
          value={`item-${index}`}
          key={index}
          className="flex h-full flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out"
        >
          <>
            <AccordionTrigger
              className={cn(
                "group flex w-full items-center justify-between transition-all duration-300 ease-in-out",
              )}
            >
              <div className="flex w-full items-center gap-2">
                {item.title}
                {item.subtitle && (
                  <div className="size-1 rounded-full bg-middleDark" />
                )}
                <p className="text-sm font-normal text-white">
                  {item.subtitle}
                </p>
              </div>
              <PlusIcon className="size-4 text-foreground transition-all duration-300 ease-in-out group-data-[state=open]:hidden" />
              <MinusIcon className="hidden size-4 text-foreground transition-all duration-300 ease-in-out group-data-[state=open]:block" />
            </AccordionTrigger>
            <AccordionContent
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                "data-[state=open]:animate-accordion-down",
                "data-[state=closed]:animate-accordion-up",
              )}
            >
              {item.content}
            </AccordionContent>
            <div className="h-px w-full border-b border-lightDark transition-opacity duration-300 ease-in-out" />
          </>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
