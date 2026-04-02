import { Settings2 } from "lucide-react";

import { ProposalInfoText } from "@/features/governance/components/proposal-overview/ProposalInfoText";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export const ProposalParametersSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const parameters = daoConfigByDaoId[daoId].whitelabel?.governanceParameters;

  if (!parameters?.length) {
    return null;
  }

  return (
    <div className="border-border-default bg-surface-default flex w-full flex-col border lg:w-[420px]">
      <div className="flex flex-col gap-4 p-3">
        <ProposalInfoText>
          <Settings2 className="text-secondary size-4" /> Contract parameters
        </ProposalInfoText>

        <div className="flex flex-col gap-3">
          {parameters.map((parameter) => (
            <div
              key={parameter.label}
              className="border-border-default flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <p className="text-secondary text-[12px] font-medium uppercase tracking-[0.72px]">
                {parameter.label}
              </p>
              <p className="text-primary text-[14px] leading-[20px]">
                {parameter.value}
              </p>
              {parameter.description ? (
                <p className="text-secondary text-[13px] leading-[18px]">
                  {parameter.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
