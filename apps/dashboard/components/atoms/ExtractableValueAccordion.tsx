"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@radix-ui/react-accordion";
import { CalculatorIcon } from "@/components/atoms";
import { PlusIcon } from "lucide-react";

export const ExtractableValueAccordion = () => {
  return (
    <Accordion type="single" collapsible className="w-full text-white">
      <AccordionItem
        value="item-1"
        className="group w-full rounded-lg border border-white/10 bg-dark p-3 hover:bg-[#26262A]"
      >
        <AccordionTrigger className="flex w-full items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-white">
            <CalculatorIcon className="h-4 w-4 text-[##71717A] group-hover:text-[#EC762E]" />
            How Governance Risk is Calculated
          </p>
          <PlusIcon className="text-foreground" />
        </AccordionTrigger>
        <AccordionContent>
          Ideal Scenario (Full Delegation Considered): This assumes that every
          delegated governance token is used in voting, which represents the
          maximum possible participation. Realistic Scenario (Average
          Participation): This takes into account how many tokens are typically
          used in governance votes, giving a more practical risk assessment.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
