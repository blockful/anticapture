import { ReactNode } from "react";
import { ALL_DAOS, DaoIdEnum } from "@/shared/types/daos";
import NotFound from "@/app/[daoId]/not-found";
import { DaoPageInteractionProvider } from "@/shared/contexts";
import daoConfigByDaoId from "@/shared/dao-config";
import { TokenDistributionProvider } from "@/features/token-distribution/contexts";
import { BaseHeaderLayoutSidebar } from "@/shared/components/";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HeaderDAOSidebar, HeaderSidebar, StickyPageHeader } from "@/widgets";
import { Footer } from "@/shared/components/design-system/footer/Footer";

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
    <TokenDistributionProvider daoId={daoIdEnum}>
      <DaoPageInteractionProvider>
        <div className="bg-surface-background dark flex h-screen overflow-hidden">
          <BaseHeaderLayoutSidebar>
            <HeaderSidebar />
            <HeaderDAOSidebar />
          </BaseHeaderLayoutSidebar>
          <main className="relative flex-1 overflow-auto lg:ml-[330px]">
            <div className="sm:hidden">
              <StickyPageHeader />
              <HeaderMobile />
            </div>
            <div className="flex min-h-screen w-full flex-col items-center">
              <div className="xl4k:max-w-7xl w-full flex-1">{children}</div>
              <Footer />
            </div>
          </main>
        </div>
      </DaoPageInteractionProvider>
    </TokenDistributionProvider>
  );
}
