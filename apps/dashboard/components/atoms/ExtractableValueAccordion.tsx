"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@radix-ui/react-accordion";
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Badge,
  BarChartSecondaryIcon,
  CalculatorIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DollarIcon,
  EqualsIcon,
  PieChartIcon,
  PlusIcon,
  TokensIcon,
  UsersIcon,
} from "@/components/atoms";

interface AccordionDataProps {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const AccordionData: AccordionDataProps[] = [
  {
    title: "How Governance Risk is Calculated",
    icon: (
      <CalculatorIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex">
            <ChevronRightIcon className="inline-flex h-4 w-4 items-center justify-center text-[#f97316]" />
          </div>
          <div className="flex flex-col">
            <p className="flex text-xs font-semibold uppercase text-foreground">
              Ideal Scenario (Full Delegation Considered)
            </p>
            <p className="card-text-accordion">
              Assumes that every delegated governance token is used in voting,
              which represents the maximum possible participation.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex">
            <ChevronRightIcon className="inline-flex h-4 w-4 items-center justify-center text-[#f97316]" />
          </div>
          <div className="flex flex-col">
            <p className="flex text-xs font-semibold uppercase text-foreground">
              Realistic Scenario (Average Participation)
            </p>
            <p className="card-text-accordion">
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
      <PieChartIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="card-text-accordion">
            This represents the total value of governance tokens that have been
            delegated to others for voting.
          </p>
          <p className="card-text-accordion">
            If all delegated tokens were used in a vote, this would be the
            highest possible governance participation level.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <Badge className="group-hover:bg-dark">
            <TokensIcon />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              ALL TOKENS IN A VOTE
            </p>
          </Badge>
          <EqualsIcon />
          <Badge className="group-hover:bg-dark">
            <BarChartSecondaryIcon />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              highest gov participation
            </p>
          </Badge>
        </div>
      </div>
    ),
  },
  {
    title: "Average Quorum",
    icon: (
      <UsersIcon className="h-4 w-4 text-[#71717A] group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="card-text-accordion">
            This measures how much voting power is actually used in decisions on
            average. It&apos;s calculated by adding up all tokens used in past
            governance votes and dividing by the number of proposals.
          </p>
          <p className="card-text-accordion">
            A lower quorum means fewer people participate in voting, making it
            easier for an attacker to take control.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <Badge className="group-hover:bg-dark">
            <ArrowDownIcon />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Lower quorum
            </p>
          </Badge>
          <EqualsIcon />
          <Badge className="group-hover:bg-dark">
            <ArrowUpIcon />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Easier to attack
            </p>
          </Badge>
        </div>
      </div>
    ),
  },
  {
    title: "Comparison to Treasury Funds",
    icon: (
      <DollarIcon className="h-4 w-4 text-foreground group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="card-text-accordion flex">
          Attack cost is compared to the DAO&apos;s total treasury assets. There
          are two ways to do this: 1. Including governance tokens: But this is
          risky because an attack could cause the price of these tokens to drop.
          2. Excluding governance tokens: This gives a clearer picture of the
          real financial security of the DAO.
        </div>
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <Badge className="group-hover:bg-dark">
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Cost to attack
            </p>
            <ChevronLeftIcon className="text-white" />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              treasury funds
            </p>
          </Badge>
          <EqualsIcon />
          <Badge className="group-hover:bg-dark">
            <AlertTriangleIcon className="text-white" />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              DAO AT RISK
            </p>
          </Badge>
        </div>
      </div>
    ),
  },
];

export const ExtractableValueAccordion = () => {
  return (
    <Accordion
      type="single"
      defaultValue="item-0"
      className="flex h-full w-full flex-col gap-3 text-white"
    >
      {AccordionData.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="group flex w-full flex-col rounded-lg border border-white/10 bg-dark p-3 transition-all duration-300 hover:bg-[#26262A] data-[state=open]:flex-1 data-[state=open]:gap-4"
        >
          <AccordionTrigger className="group/trigger flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-white group-data-[state=open]/trigger:text-white">
              {item.icon}
              {item.title}
            </div>
            <PlusIcon className="h-4 w-4 text-foreground transition-all duration-300 group-data-[state=open]/trigger:hidden" />
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden transition-all">
            <div className="flex flex-1 flex-col gap-2">{item.content}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
