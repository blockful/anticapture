"use client";

import { PageSkeleton } from "@/shared/components/skeletons/PageSkeleton";
import { DaoOverviewSkeleton } from "@/features/dao-overview/skeleton/DaoOverviewSkeleton";
import { useParams, usePathname } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";

export default function Loading() {
  const { daoId }: { daoId?: string } = useParams();
  const pathname = usePathname();

  // Check if this is a DAO page with valid daoId
  if (daoId && pathname === `/${daoId}`) {
    const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
    const daoConfig = daoConfigByDaoId[daoIdEnum];

    // If it's a valid DAO page, show DAO overview skeleton
    if (daoConfig && daoConfig.daoOverview && pathname === `/${daoId}`) {
      return (
        <div className="bg-surface-background dark flex h-screen overflow-hidden">
          <DaoOverviewSkeleton />
        </div>
      );
    }
  }

  return <PageSkeleton />;
}
