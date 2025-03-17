"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@radix-ui/react-accordion";
import {
  CalculatorIcon,
  DollarIcon,
  PieChartIcon,
  UsersIcon,
} from "@/components/atoms";
import { ChevronRight, PlusIcon } from "lucide-react";
import React from "react";

interface AccordionDataProps {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const AccordionData: AccordionDataProps[] = [
  {
    title: "How Governance Risk is Calculated",
    icon: (
      <CalculatorIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-[#EC762E]" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex">
            <ChevronRight className="inline-flex h-4 w-4 items-center justify-center text-[#f97316]" />
          </div>
          <div className="flex flex-col">
            <p className="flex text-xs font-semibold uppercase text-foreground">
              Ideal Scenario (Full Delegation Considered):
            </p>
            <p className="text-sm font-normal leading-tight text-foreground">
              Assumes that every delegated governance token is used in voting,
              which represents the maximum possible participation.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex">
            <ChevronRight className="inline-flex h-4 w-4 items-center justify-center text-[#f97316]" />
          </div>
          <div className="flex flex-col">
            <p className="flex text-xs font-semibold uppercase text-foreground">
              Realistic Scenario (Average Participation)
            </p>
            <p className="text-sm font-normal leading-tight text-foreground">
              This takes into account how many tokens are typically used in
              governance votes, giving a more practical risk assessment.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Delegated Cap",
    icon: (
      <PieChartIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-[#EC762E]" />
    ),
    content:
      "Ideal Scenario (Full Delegation Considered): This assumes that every delegated governance token is used in voting, which represents the maximum possible participation. Realistic Scenario (Average Participation): This takes into account how many tokens are typically used in governance votes, giving a more practical risk assessment.",
  },
  {
    title: "Average Quorum",
    icon: (
      <UsersIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-[#EC762E]" />
    ),
    content:
      "Ideal Scenario (Full Delegation Considered): This assumes that every delegated governance token is used in voting, which represents the maximum possible participation. Realistic Scenario (Average Participation): This takes into account how many tokens are typically used in governance votes, giving a more practical risk assessment.",
  },
  {
    title: "Comparison to Treasury Funds",
    icon: (
      <DollarIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-[#EC762E]" />
    ),
    content:
      "Ideal Scenario (Full Delegation Considered): This assumes that every delegated governance token is used in voting, which represents the maximum possible participation. Realistic Scenario (Average Participation): This takes into account how many tokens are typically used in governance votes, giving a more practical risk assessment.",
  },
];

export const ExtractableValueAccordion = () => {
  return (
    <Accordion
      type="single"
      collapsible
      className="flex h-full w-full flex-col gap-3 text-white"
    >
      {AccordionData.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="group flex w-full flex-col rounded-lg border border-white/10 bg-dark p-3 hover:bg-[#26262A] data-[state=open]:flex-1 data-[state=open]:gap-4"
        >
          <AccordionTrigger className="group/trigger flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-white group-data-[state=open]/trigger:text-white">
              {item.icon}
              {item.title}
            </div>
            <PlusIcon className="h-4 w-4 text-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-45" />
          </AccordionTrigger>
          <AccordionContent className="flex flex-1 flex-col gap-2 text-sm font-normal text-foreground">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
