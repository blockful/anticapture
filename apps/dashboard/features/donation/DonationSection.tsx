"use client";

import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { Heart } from "lucide-react";
import { TheSectionLayout } from "@/shared/components";
import {
  DonationCard,
  FundingSourcesCard,
} from "@/features/donation/components";
import { DONATION_CONSTANTS } from "@/features/donation/utils/donation-constants";

export const DonationSection = () => {
  const { donation, fundingSources } = DONATION_CONSTANTS;

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.donate.title}
      icon={<Heart className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.donate.description}
      anchorId={SECTIONS_CONSTANTS.donate.anchorId}
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
    >
      <div className="space-y-8">
        {/* Main donation card with integrated benefits */}
        <DonationCard
          title={donation.title}
          description={donation.description}
          address={donation.address}
          ensAddress={donation.ensAddress}
          qrCodeUrl={donation.qrCodeUrl}
          supportedChains={donation.supportedChains}
          chainLinks={donation.chainLinks}
        />

        {/* Funding sources */}
        <FundingSourcesCard
          title="FUNDING SOURCES"
          description="Supported by DAOs, foundations, and contributors committed to protecting Ethereum governance."
          sources={fundingSources}
        />
      </div>
    </TheSectionLayout>
  );
};
