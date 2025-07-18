"use client";

import { MouseEvent } from "react";
import { AccordionContentArea } from "@/shared/components";
import { FaqItem } from "../utils/faq-constants";

export const FaqCard = ({
  faqItem,
  isOpen,
  onToggle,
}: {
  faqItem: FaqItem;
  isOpen: boolean;
  onToggle: (e: MouseEvent<HTMLDivElement>) => void;
}) => {
  return (
    <AccordionContentArea
      id={faqItem.id}
      title={faqItem.question}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="text-secondary prose prose-sm max-w-none text-sm">
        {faqItem.answer}
      </div>
    </AccordionContentArea>
  );
};
