"use client";

import { ReactNode } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@radix-ui/react-accordion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calculator,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Equal,
  PieChart,
  Plus,
  Users,
} from "lucide-react";
import { Badge } from "@/shared/components/badges/Badge";

interface AccordionDataProps {
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

//TODO: Adjust the layout of the accordion to be more consistent with the Figma Design
const AccordionData: AccordionDataProps[] = [
  {
    title: "How Governance Risk is Calculated",
    icon: (
      <Calculator className="size-4 text-icon-secondary group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex">
            <ChevronRight className="inline-flex size-4 items-center justify-center text-brand" />
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
            <ChevronRight className="inline-flex size-4 items-center justify-center text-brand" />
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
      <PieChart className="size-4 text-icon-secondary group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="card-text-accordion">
            This represents the total value of governance tokens that have been
            delegated to addresses for voting.
          </p>
          <p className="card-text-accordion">
            After a proposal’s voting delay is over there’s a snapshot of voting
            power, and any delegations after that won’t be considered for that
            proposal.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <Badge className="group-hover:bg-dark">
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Voting power in a proposal
            </p>
          </Badge>
          <Equal className="size-4 text-white" />
          <Badge className="group-hover:bg-dark">
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Delegated cap at snapshot
            </p>
          </Badge>
        </div>
      </div>
    ),
  },
  {
    title: "Average Turnout and Active Supply",
    icon: (
      <Users className="size-4 text-icon-secondary group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="card-text-accordion">
            This measures the average amount of voting power used in decisions.
            Average Turnout is calculated by adding up all tokens used in past
            governance votes and dividing by the number of proposals, while
            Active Supply looks at all voters in proposals in a given time frame
            and calculates their current voting power.
          </p>
          <p className="card-text-accordion">
            Lower numbers in those mean fewer tokens being used in voting,
            making it easier for an attacker to take control.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <Badge className="group-hover:bg-dark">
            <ArrowDown className="size-4 text-foreground" />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Lower Participation
            </p>
          </Badge>
          <Equal className="size-4 text-white" />
          <Badge className="group-hover:bg-dark">
            <ArrowUp className="size-4 text-foreground" />
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
      <DollarSign className="size-4 text-icon-secondary group-data-[state=open]/trigger:text-tangerine" />
    ),
    content: (
      <div className="flex flex-col gap-3">
        <div className="card-text-accordion flex">
          Attack cost is compared to the DAO&apos;s treasury assets. There are
          two ways to do this: 1. Including governance tokens, which is more
          volatile given the token price is normally very impacted by an attack,
          or 2. Excluding governance tokens, which shows a closer picture of
          what an attacker would have as “minimum profit” from a well-executed
          capture.
        </div>
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <Badge className="group-hover:bg-dark">
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              Cost to attack
            </p>
            <ChevronLeft className="size-4 text-foreground" />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              treasury funds
            </p>
          </Badge>
          <Equal className="size-4 text-white" />
          <Badge className="group-hover:bg-dark">
            <AlertTriangle className="size-4 text-foreground" />
            <p className="text-xs font-semibold uppercase leading-none text-foreground">
              DAO AT RISK
            </p>
          </Badge>
        </div>
      </div>
    ),
  },
];

export const AttackProfitabilityAccordion = () => {
  return (
    <Accordion
      type="single"
      defaultValue="item-0"
      className="flex h-full w-full flex-col gap-2 text-white sm:gap-3"
    >
      {AccordionData.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="group flex w-full flex-col rounded-lg border border-light-dark bg-dark transition-all duration-300 hover:bg-[#26262A] data-[state=open]:flex-1 data-[state=open]:gap-4 data-[state=open]:border-white/10"
        >
          <AccordionTrigger className="group/trigger flex w-full items-center justify-between px-3 pt-3 data-[state=closed]:pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-white group-data-[state=open]/trigger:text-white">
              {item.icon}
              {item.title}
            </div>
            <Plus className="size-4 text-foreground transition-all duration-300 group-data-[state=open]/trigger:hidden" />
          </AccordionTrigger>
          <AccordionContent className="overflow-hidden px-3 pb-3 transition-all">
            <div className="flex flex-1 flex-col gap-2">{item.content}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
