import { HeartIcon } from "lucide-react";
import { TheSectionLayout } from "@/components/atoms";
import { showSupportSectionAnchorID } from "@/lib/client/constants";
import daoConstants from "@/lib/dao-constants";
import { SupportDaoCard } from "../molecules/SupportDaoCard";
import { useRouter } from "next/navigation";

export const ShowSupportSection = () => {
  const router = useRouter();
  return (
    <TheSectionLayout
      title="Support Potential DAOs"
      icon={<HeartIcon className="text-foreground" />}
      description="Show support for your favorite DAOs, so it can be fully supported by Anticapture! It's free and easy!"
      anchorId={showSupportSectionAnchorID}
    >
      <div className="flex flex-wrap gap-4">
        {Object.values(daoConstants).map((dao) => (
          <SupportDaoCard
            key={dao.name}
            daoIcon={dao.icon}
            daoName={dao.name}
            daoId={dao.id}
            totalCountSupport={1}
            votingPowerSupport={1000000}
            userSupport={true}
            onClick={() => {
              router.push(`/${dao.id}`);
            }}
          />
        ))}
      </div>
    </TheSectionLayout>
  );
};
