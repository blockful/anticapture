"use client";

import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { HeartIcon } from "lucide-react";
import { CardDaoSignature, TheSectionLayout } from "@/components/atoms";
import { CardPetitionInformation } from "@/components/molecules/CardPetitionInformation";
import { useAccount } from "wagmi";
import { usePetitionSignatures } from "@/hooks/usePetition";
import { DaoIdEnum } from "@/lib/types/daos";

export const ShowSupportSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { isConnected, address } = useAccount();
  const { data, loading } = usePetitionSignatures(
    daoId.toUpperCase() as DaoIdEnum,
    address,
  );
  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.showSupport.title}
      icon={<HeartIcon className="text-foreground" />}
      anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
      className="gap-5 sm:gap-4"
    >
      <CardPetitionInformation data={data} />
      <CardDaoSignature
        data={data}
        loading={loading}
        isConnected={isConnected}
        address={address}
      />
    </TheSectionLayout>
  );
};
