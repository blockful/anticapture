"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { CheckCircle, MinusIcon } from "lucide-react";
import { ReactNode } from "react";
import { Stage } from "@/components/atoms/StageTag";
import { StageTagSimplified } from "@/components/atoms/StageTagSimplified";
import { PlusIcon } from "@/components/atoms/icons/PlusIcon";

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
          <h3 className="text-[13px] font-medium leading-[18px] tracking-[6%] text-white">
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
          <h3 className="text-[13px] font-medium leading-[18px] tracking-[6%] text-white">
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
    subtitle: "1 issue needs fixing",
    title: <StageTagSimplified stage={Stage.TWO} isCompleted={false} />,
    content: (
      <div className="flex w-full flex-col gap-4 rounded-md bg-lightDark p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:max-w-[200px]">
          <h3 className="text-[13px] font-medium leading-[18px] tracking-[6%] text-white">
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
              All DAOs that have governor and timelock are considered at least{" "}
              <span className="whitespace-nowrap text-white"> Stage 0.</span>
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
];

export const StageAccordion = () => {
  return (
    <Accordion type="multiple" className="flex h-full flex-col gap-3">
      {AccordionData.map((item, index) => (
        <AccordionItem
          value={`item-${index}`}
          key={index}
          className="flex h-full flex-col gap-3"
        >
          <>
            <AccordionTrigger className="group flex w-full items-center justify-between">
              <div className="flex w-full items-center gap-2">
                {item.title}
                {item.subtitle && (
                  <div className="size-1 rounded-full bg-middleDark" />
                )}
                <p className="text-sm font-normal text-white">
                  {item.subtitle}
                </p>
              </div>
              <PlusIcon className="size-4 text-foreground transition-all duration-200 group-data-[state=open]:hidden" />
              <MinusIcon className="hidden size-4 text-foreground transition-all duration-200 group-data-[state=open]:block" />
            </AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
            <div className="h-px w-full border-b border-lightDark" />
          </>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
