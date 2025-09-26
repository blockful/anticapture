import { ReactNode } from "react";
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

export default async function DaoLayout({ children }: DaoLayoutProps) {
  return (
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
  );
}
