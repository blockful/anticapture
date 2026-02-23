import { ReactNode } from "react";

import NotFound from "@/app/not-found";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { ALL_DAOS, DaoIdEnum } from "@/shared/types/daos";
import { HeaderDAOSidebar, HeaderSidebar, StickyPageHeader } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";
// import { BaseHeaderLayoutSidebar } from "@/shared/components";

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

  // Check if DAO exists and handle support stages
  if (!ALL_DAOS.includes(daoIdEnum)) {
    return <NotFound />;
  }

  // For FULL, IN_ANALYSIS and ELECTION stages, render the layout with appropriate providers
  return (
    <div className="bg-surface-background dark relative mx-auto flex h-screen max-w-screen-2xl">
      <div className="active relative hidden h-screen lg:flex">
        <div className="w-17 h-full shrink-0 overflow-y-auto">
          <HeaderSidebar />
        </div>
        <div className="h-full shrink-0">
          <HeaderDAOSidebar />
        </div>
      </div>
      <main className="h-screen flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile />
          <StickyPageHeader />
        </div>
        <div className="flex w-full flex-col items-center lg:h-screen">
          <div className="w-full flex-1">{children}</div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
