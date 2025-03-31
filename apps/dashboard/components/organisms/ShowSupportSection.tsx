"use client";

import { HeartIcon } from "lucide-react";
import { TheSectionLayout } from "@/components/atoms";
import daoConstants from "@/lib/dao-constants";
import { useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { usePetition } from "@/hooks/usePetition";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ReachOutToUsCard, SupportDaoCard } from "@/components/molecules";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { PetitionResponse } from "@/hooks/usePetition";

export const ShowSupportSection = () => {
  const router = useRouter();

  const { address } = useAccount();

  const petitions: Record<DaoIdEnum, PetitionResponse | undefined> = {
    [DaoIdEnum.ENS]: usePetition(DaoIdEnum.ENS, address).data,
    [DaoIdEnum.UNISWAP]: usePetition(DaoIdEnum.UNISWAP, address).data,
    [DaoIdEnum.OPTIMISM]: usePetition(DaoIdEnum.OPTIMISM, address).data,
    
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.showSupport.title}
      icon={<HeartIcon className="text-foreground" />}
      description={SECTIONS_CONSTANTS.showSupport.description}
      anchorId={SECTIONS_CONSTANTS.showSupport.anchorId}
    >
      <div className="flex flex-wrap gap-4">
        {Object.entries(daoConstants).map(([daoId, dao]) => (
          <SupportDaoCard
            key={dao.name}
            daoIcon={dao.icon}
            daoName={dao.name}
            daoId={daoId as DaoIdEnum}
            totalCountSupport={petitions[daoId as DaoIdEnum]?.totalSignatures || 0}
            votingPowerSupport={Number(
              formatEther(BigInt(petitions[daoId as DaoIdEnum]?.totalSignaturesPower || 0)),
            )}
            userSupport={petitions[daoId as DaoIdEnum]?.userSigned || false}
            onClick={() => {
              router.push(`/${daoId}`);
            }}
          />
        ))}
        <ReachOutToUsCard />
      </div>
    </TheSectionLayout>
  );
};
