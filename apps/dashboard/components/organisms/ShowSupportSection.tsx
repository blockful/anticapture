import { HeartIcon } from "lucide-react";
import { TheSectionLayout } from "@/components/atoms";
import { showSupportSectionAnchorID } from "@/lib/client/constants";
import daoConstants from "@/lib/dao-constants";
import { SupportDaoCard } from "../molecules/SupportDaoCard";
import { useRouter } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { usePetition } from "@/hooks/usePetition";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ReachOutToUsCard } from "../molecules/ReachOutToUsCard";
export const ShowSupportSection = () => {
  const router = useRouter();

  const { address } = useAccount();

  const petitions = {
    [DaoIdEnum.ENS]: usePetition(DaoIdEnum.ENS, address).data,
    [DaoIdEnum.UNISWAP]: usePetition(DaoIdEnum.UNISWAP, address).data,
  };

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
            totalCountSupport={petitions[dao.id]?.totalSignatures || 0}
            votingPowerSupport={Number(
              // formatEther(BigInt(petitions[dao.id]?.totalSignaturesPower || 0)),
              1000000
            )}
            userSupport={petitions[dao.id]?.userSigned || false}
            onClick={() => {
              router.push(`/${dao.id}`);
            }}
          />
        ))}
        <ReachOutToUsCard />
      </div>
    </TheSectionLayout>
  );
};
