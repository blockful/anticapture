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
      className="gap-5 px-4 py-8 sm:gap-4"
    >
      <CardPetitionInformation />
      <CardDaoSignature />
    </TheSectionLayout>
  );
};
