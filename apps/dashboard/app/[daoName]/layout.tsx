import { DaoName, SUPPORTED_DAO_NAMES } from "@/lib/types/daos";
import { notFound } from "next/navigation";
import { DaoDataProvider } from "@/components/contexts/dao-data-provider";
import NotFound from "./not-found";

interface DaoLayoutProps {
  children: React.ReactNode;
  params: { daoName: string };
}

export default function DaoLayout({ children, params }: DaoLayoutProps) {
  console.log("params", params);
  const { daoName } = params;
  console.log("daoName", daoName);

  const daoNameUpperCase = daoName.toUpperCase();
  console.log("daoNameUpperCase", daoNameUpperCase);

  if (!SUPPORTED_DAO_NAMES.includes(daoNameUpperCase as DaoName)) {
    return <NotFound />;
  }

  return (
    <DaoDataProvider daoName={daoNameUpperCase as DaoName}>
      {children}
    </DaoDataProvider>
  );
}
