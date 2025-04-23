"use client";

import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { HeartIcon } from "lucide-react";
import { CardDaoSignature, TheSectionLayout } from "@/components/atoms";
import { CardPetitionInformation } from "@/components/molecules/CardPetitionInformation";

export const ShowSupportSection = () => {
  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.showSupport.title}
      icon={<HeartIcon className="text-foreground" />}
      anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
      className="gap-5 border-b-2 border-b-white/10 px-4 py-8 sm:gap-4 sm:px-0 sm:pb-0 sm:pt-0"
    >
      <CardPetitionInformation />
      <CardDaoSignature />
    </TheSectionLayout>
  );
};
