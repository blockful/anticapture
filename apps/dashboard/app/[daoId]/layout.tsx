import { ReactNode } from "react";
import { ALL_DAOS, DaoIdEnum } from "@/shared/types/daos";
import { DaoDataProvider } from "@/shared/contexts/DaoDataContext";
import NotFound from "@/app/[daoId]/not-found";
import { DaoPageInteractionProvider } from "@/shared/contexts";
import daoConfigByDaoId from "@/shared/dao-config";
import { TokenDistributionProvider } from "@/features/token-distribution/contexts";
import { GovernanceActivityProvider } from "@/features/governance-activity/contexts";

type DaoParams = {
  daoId: string;
};

interface DaoLayoutProps {
  children: ReactNode;
  params: Promise<DaoParams>;
}

export default async function DaoLayout({ children, params }: DaoLayoutProps) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoIdEnum];

  // Check if DAO exists and handle support stages
  if (!ALL_DAOS.includes(daoIdEnum)) {
    return <NotFound reason="not_found" />;
  }

  // Handle empty analysis DAOs
  if (daoConstants.disableDaoPage) {
    return <NotFound reason={"disabled"} />;
  }

  // For FULL, IN_ANALYSIS and ELECTION stages, render the layout with appropriate providers
  return (
    <DaoDataProvider daoId={daoIdEnum}>
      <TokenDistributionProvider daoId={daoIdEnum}>
        <GovernanceActivityProvider daoId={daoIdEnum}>
          <DaoPageInteractionProvider>{children}</DaoPageInteractionProvider>
        </GovernanceActivityProvider>
      </TokenDistributionProvider>
    </DaoDataProvider>
  );
}
