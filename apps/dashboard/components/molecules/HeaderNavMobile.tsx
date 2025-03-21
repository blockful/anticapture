import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { ButtonHeaderDAOSidebarMobile } from "@/components/atoms";

export const HeaderNavMobile = () => {
  const options = [
    {
      anchorId: SECTIONS_CONSTANTS.daoInfo.anchorId,
      title: SECTIONS_CONSTANTS.daoInfo.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.attackProfitability.anchorId,
      title: SECTIONS_CONSTANTS.attackProfitability.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.tokenDistribution.anchorId,
      title: SECTIONS_CONSTANTS.tokenDistribution.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceActivity.anchorId,
      title: SECTIONS_CONSTANTS.governanceActivity.title,
    },
    {
      anchorId: SECTIONS_CONSTANTS.governanceImplementation.anchorId,
      title: SECTIONS_CONSTANTS.governanceImplementation.title,
    },
  ];

  return (
    <div className="w-full">
      <div className="scrollbar-none w-full overflow-x-auto">
        <ButtonHeaderDAOSidebarMobile options={options} />
      </div>
    </div>
  );
};
