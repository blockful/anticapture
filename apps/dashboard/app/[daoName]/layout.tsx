import { DaoName, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import { DaoDataProvider } from "@/components/contexts/DaoDataContext";
import NotFound from "./not-found";

interface DaoLayoutProps {
  children: React.ReactNode;
  params: { daoName: string };
}

export default function DaoLayout({ children, params }: DaoLayoutProps) {
  const { daoName } = params;

  const daoNameUpperCase = daoName.toUpperCase();

  if (!SUPPORTED_DAO_NAMES.includes(daoNameUpperCase as DaoName)) {
    return <NotFound />;
  }

  return (
    <DaoDataProvider daoName={daoNameUpperCase as DaoName}>
      {children}
    </DaoDataProvider>
  );
}
