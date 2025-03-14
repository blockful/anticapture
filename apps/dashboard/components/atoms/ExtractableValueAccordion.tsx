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
import { PlusIcon } from "lucide-react";

interface AccordionDataProps {
  title: string;
  icon: React.ReactNode;
  content: string;
}

const AccordionData: AccordionDataProps[] = [
  {
    title: "How Governance Risk is Calculated",
    icon: (
      <CalculatorIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-[#EC762E]" />
    ),
    content:
      "Ideal Scenario (Full Delegation Considered): This assumes that every delegated governance token is used in voting, which represents the maximum possible participation. Realistic Scenario (Average Participation): This takes into account how many tokens are typically used in governance votes, giving a more practical risk assessment.",
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
  return AccordionData.map((item, index) => (
    <Accordion
      key={index}
      type="single"
      collapsible
      className="flex w-full flex-col gap-3 text-white"
    >
      <AccordionItem
        value="item-1"
        className="group flex w-full flex-col rounded-lg border border-white/10 bg-dark p-3 hover:bg-[#26262A] data-[state=open]/trigger:gap-4"
      >
        <AccordionTrigger className="group/trigger flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-white group-data-[state=open]/trigger:text-white">
            {item.icon}
            {item.title}
          </div>
          <PlusIcon className="h-4 w-4 text-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-45" />
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 text-sm font-normal text-foreground">
          {item.content}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ));
};
