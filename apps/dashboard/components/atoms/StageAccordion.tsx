"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { AlertTriangle, CheckCircle, MinusIcon } from "lucide-react";
import { ReactNode } from "react";
import { PlusIcon } from "@/components/atoms";
import { Stage } from "@/components/atoms/StageTag";
import { StageTagSimplified } from "@/components/atoms/StageTagSimplified";
import { cn } from "@/lib/client/utils";
import { DotFilledIcon } from "@radix-ui/react-icons";

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
      <div className="flex w-full flex-col gap-4 rounded-md bg-lightDark p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:max-w-[200px]">
          <h3 className="font-roboto text-[13px] font-medium uppercase leading-[18px] tracking-[6%] text-white">
            Critical Vulnerabilities
          </h3>
          <p className="text-sm font-normal text-foreground">
            At least one High Risk issue identified
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium tracking-[6%] text-white">
            REQUIREMENTS
          </h4>
          <div className="flex flex-row gap-2">
            <div className="flex items-start">
              <CheckCircle className="size-4 text-success" />
            </div>
            <p className="flex flex-wrap text-sm font-normal text-foreground">
              All DAOs that have governor and timelock are considered at
              least&nbsp;
              <span className="whitespace-nowrap text-white">Stage 0.</span>
              <span className="block">
                At this stage, critical risks still be present and require
                attention.
              </span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    subtitle: "",
    title: <StageTagSimplified stage={Stage.ONE} />,
    content: (
      <div className="flex w-full flex-col gap-4 rounded-md bg-lightDark p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:max-w-[200px]">
          <h3 className="font-roboto text-[13px] font-medium uppercase leading-[18px] tracking-[6%] text-white">
            Partial Risk Reduction
          </h3>
          <p className="text-sm font-normal text-foreground">
            No High Risk issues, at least one Medium Risk issue remains
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium tracking-[6%] text-white">
            REQUIREMENTS
          </h4>
          <div className="flex flex-row gap-2">
            <div className="flex items-start">
              <CheckCircle className="size-4 text-success" />
            </div>
            <p className="flex flex-wrap text-sm font-normal text-foreground">
              Has no implementation details flagged as High Risk, but at least
              one remains at Medium Risk, qualifying it as&nbsp;
              <span className="whitespace-nowrap text-white"> Stage 1.</span>
              <span className="block">
                Progress has been made, but further improvements are still
                needed to enhance security.
              </span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    subtitle: "3 issue needs fixing",
    title: <StageTagSimplified stage={Stage.TWO} isCompleted={false} />,
    content: (
      <div className="flex w-full flex-col gap-4 rounded-md bg-lightDark p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:max-w-[200px]">
          <h3 className="font-roboto text-[13px] font-medium uppercase leading-[18px] tracking-[6%] text-white">
            Minimal Risks
          </h3>
          <p className="text-sm font-normal text-foreground">
            No High Risk issues, at least one Medium Risk issue remains
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium uppercase tracking-[6%] text-white">
            issues that need to be fixed
          </h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-warning" />
              <p className="text-sm font-normal text-warning">Voting Period</p>
            </div>
            <div className="flex justify-start gap-2">
              <div>
                <DotFilledIcon className="size-4 text-[#52525B]" />
              </div>
              <p className="text-sm font-normal text-foreground">
                The current voting period of 2 days is too short to allow for
                aligned delegates to defend the DAO against an attack.
              </p>
            </div>
          </div>
          <div className="border-t border-middleDark" />
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-warning" />
              <p className="text-sm font-normal text-warning">
                Spam Prevention
              </p>
            </div>
            <div className="flex justify-start gap-2">
              <div>
                <DotFilledIcon className="size-4 text-[#52525B]" />
              </div>
              <p className="text-sm font-normal text-foreground">
                The DAO currently lacks sufficient protections against proposal
                spamming, increasing the risk of governance attacks.
              </p>
            </div>
          </div>
        </div>
      </div>
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
