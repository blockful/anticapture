import { Metadata } from "next";
import { DaoTemplate } from "@/components/04-templates";
import { DaoIdEnum } from "@/lib/types/daos";

export const metadata: Metadata = {
  title: "Governance dashboard",
  keywords: ["governance", "dao", "data"],
};

export default function DaoPage({
  params,
}: {
  params: { daoId: string };
}) {
  const daoId = params.daoId.toUpperCase() as DaoIdEnum;

  return (
    <div className="mx-auto flex flex-col items-center gap-8 px-8 py-6 lg:gap-16 xl:overflow-auto">
      <DaoTemplate
        params={{
          daoId: daoId,
        }}
      />
    </div>
  );
}
