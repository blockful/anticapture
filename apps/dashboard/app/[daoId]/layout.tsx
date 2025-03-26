import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import { DaoDataProvider } from "@/contexts/DaoDataContext";
import NotFound from "@/app/[daoId]/not-found";
import { HeaderDAOSidebar } from "@/components/molecules";
import { TokenDistributionProvider } from "@/contexts/TokenDistributionContext";
import { GovernanceActivityProvider } from "@/contexts/GovernanceActivityContext";
import daoConstantsByDaoId from "@/lib/dao-constants";

interface DaoLayoutProps {
  children: React.ReactNode;
  params: { daoId: string };
}

export default function DaoLayout({ children, params }: DaoLayoutProps) {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  if (!SUPPORTED_DAO_NAMES.includes(daoId) || daoConstantsByDaoId[daoId].inAnalysis) {
    return <NotFound />;
  }

  return (
    <DaoDataProvider daoId={daoId}>
      <TokenDistributionProvider daoId={daoId}>
        <GovernanceActivityProvider daoId={daoId}>
          <HeaderDAOSidebar />
          {children}
        </GovernanceActivityProvider>
      </TokenDistributionProvider>
    </DaoDataProvider>
  );
}
