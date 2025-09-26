"use client";

import { BlankSlate, Button, TheSectionLayout } from "@/shared/components";
import { useState } from "react";
import { cn } from "@/shared/utils/";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { HelpCircle, SearchXIcon } from "lucide-react";
import { useScreenSize } from "@/shared/hooks";
import { FaqCard } from "@/features/faq/components";
import { FAQ_ITEMS } from "@/features/faq/utils/faq-constants";
import Link from "next/link";
import { TelegramIcon } from "@/shared/components/icons";

export const FaqSection = () => {
  const { isDesktop, isTablet } = useScreenSize();
  const [openCardIds, setOpenCardIds] = useState<string[]>([]);

  const handleToggle = (
    e: React.MouseEvent<Element, MouseEvent>,
    cardId: string,
    isOpen: boolean,
  ) => {
    if (isDesktop || isTablet) {
      e.stopPropagation();
      if (isOpen) {
        setOpenCardIds([]);
        return;
      }
      setOpenCardIds([cardId]);
      return;
    }

    setOpenCardIds((prev) => {
      if (isOpen) {
        return prev.filter((id) => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.faq.title}
      icon={<HelpCircle className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.faq.description}
      anchorId={SECTIONS_CONSTANTS.faq.anchorId}
      className="bg-surface-background! border-b-0!"
    >
      <div className="flex flex-col gap-6">
        {/* Mobile-only dashed line separator */}
        <div className="border-light-dark -mx-4 border-t border-dashed sm:hidden" />

        {/* FAQ Items */}
        <div className="relative flex flex-wrap gap-2">
          <div
            className={cn(
              "absolute inset-0 z-10 transition-all duration-200 ease-in-out sm:bg-black sm:transition-opacity",
              openCardIds.length > 0
                ? "hidden sm:block sm:opacity-50"
                : "pointer-events-none opacity-0",
            )}
            onClick={() => setOpenCardIds([])}
          />

          {FAQ_ITEMS.map((faqItem, index: number) => {
            const cardId = faqItem.id;
            const isOpen = openCardIds.includes(cardId);

            return (
              <div key={index} className="w-full md:w-[calc(50%-4px)]">
                <FaqCard
                  faqItem={faqItem}
                  isOpen={isOpen}
                  onToggle={(e) => {
                    handleToggle(e, cardId, isOpen);
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Talk to our team section */}
        <BlankSlate
          variant="title"
          className="bg-surface-default"
          icon={SearchXIcon}
          title="[STATUS: ANSWER NOT LOCATED]"
          description="Contact us we'll reply soon."
        >
          <Link
            href="https://t.me/+uZlI0EZS2WM5YzMx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline">
              <TelegramIcon className="size-5" />
              Send Message
            </Button>
          </Link>
        </BlankSlate>
      </div>
    </TheSectionLayout>
  );
};
