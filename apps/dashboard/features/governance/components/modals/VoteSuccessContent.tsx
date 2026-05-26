import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Button } from "@/shared/components";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  getDaoGovernanceListPath,
  getDaoNotificationsPath,
} from "@/shared/utils/whitelabel";

interface VoteSuccessContentProps {
  onClose: () => void;
}

export const VoteSuccessContent = ({ onClose }: VoteSuccessContentProps) => {
  const daoIdParam = useParams().daoId as string;
  const daoId = daoIdParam.toUpperCase() as DaoIdEnum;
  const pathname = usePathname();

  const proposalsPath = getDaoGovernanceListPath({ daoId, pathname });

  const notificationsPath = getDaoNotificationsPath({ daoId, pathname });

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8">
      <div className="bg-surface-opacity-success flex size-12 items-center justify-center rounded-full">
        <CheckCircle2 className="text-success size-6" />
      </div>

      <h3 className="text-primary text-center text-lg font-medium">
        Vote submitted successfully!
      </h3>

      <p className="text-secondary max-w-sm text-center text-sm leading-5">
        Your vote is in, now see how it plays out. Get real-time updates on this
        proposal delivered straight to your Telegram.
      </p>

      <div className="mt-4 flex w-full items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <Link
            href={proposalsPath}
            onClick={() => {
              onClose();
            }}
          >
            Back to proposals
          </Link>
        </Button>
        <Button asChild>
          <Link href={notificationsPath} onClick={onClose}>
            Get Notifications
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
