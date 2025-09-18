import { DaoAvatarIcon } from "@/shared/components/icons";
import { DaoIdEnum } from "@/shared/types/daos";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProposalHeaderProps {
  daoId: string;
}

export const ProposalHeader = ({ daoId }: ProposalHeaderProps) => {
  return (
    <div className="text-primary border-border-default flex h-[60px] w-full items-center justify-between gap-6 border-b px-5 py-2">
      <div className="flex items-center gap-2">
        <Link
          href={`/${daoId}/governance`}
          className="hover:bg-surface-default p-2 transition-colors duration-300"
        >
          <ArrowLeft className="size-[14px]" />
        </Link>

        <DaoAvatarIcon
          daoId={daoId.toUpperCase() as DaoIdEnum}
          className="size-icon-sm"
          isRounded
        />
        <p className="text-secondary text-[14px] font-normal leading-[20px]">
          {daoId.toUpperCase()}&apos;s proposal details
        </p>
      </div>
    </div>
  );
};
