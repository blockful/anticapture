"use client";

import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
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
      title={PAGES_CONSTANTS.donate.title}
      icon={<Heart className="section-layout-icon" />}
      description={PAGES_CONSTANTS.donate.description}
      className="bg-surface-background! mt-[56px]! sm:mt-0!"
    >
      <div className="flex flex-col gap-2">
        {/* Dashed line separator - Mobile only */}
        <div className="border-light-dark -mx-4 border-t border-dashed sm:hidden" />

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
        <div className="border-light-dark -mx-4 border-t sm:hidden" />
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
