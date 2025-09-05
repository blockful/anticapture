"use client";

import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { HeartIcon } from "lucide-react";
import { TheSectionLayout } from "@/shared/components";
import {
  CardPetitionInformation,
  CardDaoSignature,
} from "@/features/show-support/components";
import { useAccount } from "wagmi";
import { usePetitionSignatures } from "@/features/show-support/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

export const ShowSupportSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { isConnected, address } = useAccount();
  const { signatures, isLoading } = usePetitionSignatures(daoId, address);

  return (
    <TheSectionLayout
      title={PAGES_CONSTANTS.showSupport.title}
      icon={<HeartIcon className="section-layout-icon" />}
      anchorId={PAGES_CONSTANTS.showSupport.anchorId}
      className="gap-5 sm:gap-4"
    >
      <CardPetitionInformation isLoading={isLoading} data={signatures} />
      <CardDaoSignature isConnected={isConnected} address={address} />
    </TheSectionLayout>
  );
};
