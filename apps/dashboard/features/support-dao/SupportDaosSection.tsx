"use client";

import { HeartIcon } from "lucide-react";
import { TheSectionLayout } from "@/components/atoms";
import { useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { SupportDaoCard } from "@/features/support-dao";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";
import daoConfigByDaoId from "@/lib/dao-config";
import { DaoConfiguration } from "@/lib/dao-config/types";
import { useMemo } from "react";
import { pickBy } from "lodash";
import { ReachOutToUsCard } from "@/features/support-dao";
import { DaoAvatarIcon } from "@/shared/components/icons";

export const SupportDaosSection = () => {
  const router = useRouter();

  // Create an object with only DAOs in election stage using lodash pickBy
  const daoConfigElectionDaos = useMemo(() => {
    // Use pickBy to filter objects where supportStage is ELECTION
    return pickBy(
      daoConfigByDaoId,
      (daoConfig: DaoConfiguration) =>
        daoConfig.supportStage === SupportStageEnum.ELECTION,
    ) as typeof daoConfigByDaoId;
  }, []);

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.supportDaos.title}
      icon={<HeartIcon className="text-foreground" />}
      description={SECTIONS_CONSTANTS.supportDaos.description}
      anchorId={SECTIONS_CONSTANTS.supportDaos.anchorId}
      className="!gap-4 !border-b-0 !bg-darkest"
    >
      <div className="flex flex-wrap gap-4">
        {Object.entries(daoConfigElectionDaos).map(([daoId, dao]) => (
          <SupportDaoCard
            key={dao.name}
            daoIcon={
              <DaoAvatarIcon
                daoId={daoId as DaoIdEnum}
                className="size-icon-md sm:size-icon-sm"
                isRounded
              />
            }
            daoName={dao.name}
            daoId={daoId as DaoIdEnum}
            onClick={() => {
              router.push(`/${daoId.toLowerCase()}`);
            }}
          />
        ))}
        <ReachOutToUsCard />
      </div>
    </TheSectionLayout>
  );
};
