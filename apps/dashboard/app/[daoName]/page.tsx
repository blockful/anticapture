import { DaoInfoTemplate } from "@/components/04-templates";
import { DaoName } from "@/lib/types/daos";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance dashboard",
  keywords: ["governance", "dao", "data"],
};

export default function DaoNameDashboard({
  params,
}: {
  params: { daoName: string };
}) {
  const { daoName } = params;

  const daoNameUpperCase = daoName.toUpperCase();

  return (
    <div className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <DaoInfoTemplate
        params={{
          daoName: daoNameUpperCase as DaoName,
        }}
      />
    </div>
  );
}
