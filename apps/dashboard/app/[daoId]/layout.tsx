import { ReactNode } from "react";
import { ALL_DAOS, DaoIdEnum } from "@/lib/types/daos";
import { DaoDataProvider } from "@/contexts/DaoDataContext";
import NotFound from "@/app/[daoId]/not-found";
import { DaoPageInteractionProvider, GovernanceActivityProvider , TokenDistributionProvider } from "@/contexts/TokenDistributionContext";
import daoConfigByDaoId from "@/lib/dao-config";

interface DaoLayoutProps {
  children: ReactNode;
  params: { daoId: string };
}

export default function DaoLayout({ children, params }: DaoLayoutProps) {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;
  const daoConstants = daoConfigByDaoId[daoId];

  // Check if DAO exists and handle support stages
  if (!ALL_DAOS.includes(daoId)) {
    return <NotFound reason="not_found" />;
  }

  // Handle empty analysis DAOs
  if (daoConstants.disableDaoPage) {
    return <NotFound reason={"disabled"} />;
  }

  // For FULL, IN_ANALYSIS and ELECTION stages, render the layout with appropriate providers
  return (
    <DaoDataProvider daoId={daoId}>
      <TokenDistributionProvider daoId={daoId}>
        <GovernanceActivityProvider daoId={daoId}>
          <DaoPageInteractionProvider>
          {children}
          </DaoPageInteractionProvider>
        </GovernanceActivityProvider>
      </TokenDistributionProvider>
    </DaoDataProvider>
  );
}
