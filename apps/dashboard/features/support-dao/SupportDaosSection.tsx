"use client";

import { HeartIcon } from "lucide-react";
import { TheSectionLayout } from "@/shared/components";
import { useRouter } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  SupportDaoCard,
  ReachOutToUsCard,
} from "@/features/support-dao/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { SupportStageEnum } from "@/shared/types/enums/SupportStageEnum";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { useMemo } from "react";
import { pickBy } from "lodash";
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
      icon={<HeartIcon className="section-layout-icon" />}
      description={SECTIONS_CONSTANTS.supportDaos.description}
      anchorId={SECTIONS_CONSTANTS.supportDaos.anchorId}
      className="bg-surface-background! gap-4! border-b-0!"
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
