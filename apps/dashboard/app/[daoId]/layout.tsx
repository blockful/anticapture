import { DaoIdEnum, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import { DaoDataProvider } from "@/components/contexts/DaoDataContext";
import NotFound from "@/app/[daoId]/not-found";
import { HeaderDAOSidebar } from "@/components/02-molecules";

interface DaoLayoutProps {
  children: React.ReactNode;
  params: { daoId: string };
}

export default function DaoLayout({ children, params }: DaoLayoutProps) {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  if (!SUPPORTED_DAO_NAMES.includes(daoId)) {
    return <NotFound />;
  }

  return (
    <DaoDataProvider daoId={daoId}>
      <HeaderDAOSidebar />
      {children}
    </DaoDataProvider>
  );
}
