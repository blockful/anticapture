import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { GetProposalQuery } from "@anticapture/graphql-client";

export const ActionsTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="text-primary flex flex-col gap-3 p-4">
      {proposal.targets.map((target, index) => (
        <ActionItem
          key={index}
          index={index}
          target={proposal.targets[index]}
          value={proposal.values[index]}
          calldata={proposal.calldatas[index]}
        />
      ))}
    </div>
  );
};

interface ActionItemProps {
  target: string | null;
  value: string | null;
  calldata: string | null;
  index: number;
}

const ActionItem = ({ target, value, calldata, index }: ActionItemProps) => {
  return (
    <div className="border-border-default flex w-full flex-col gap-2 border">
      <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 p-3">
        <div>
          <p className="text-primary font-roboto-mono text-[12px] font-medium uppercase not-italic leading-[16px] tracking-[0.72px]">
            Action {index + 1}
          </p>
        </div>
        <DefaultLink
          href={`https://etherscan.io/address/${target}`}
          openInNewTab
          className="text-secondary font-roboto-mono text-[12px] font-medium uppercase not-italic leading-[16px] tracking-[0.72px]"
        >
          Contract
        </DefaultLink>
      </div>

      <div className="flex w-full flex-col gap-2 p-3">
        <div className="flex w-full gap-2">
          <p className="font-menlo min-w-[88px] text-[14px] font-normal not-italic leading-[20px]">
            Target:
          </p>
          <p className="text-secondary font-menlo text-[14px] font-normal not-italic leading-[20px]">
            {target}
          </p>
        </div>

        <div className="flex w-full gap-2">
          <p className="font-menlo min-w-[88px] text-[14px] font-normal not-italic leading-[20px]">
            Calldata:
          </p>
          <p className="text-secondary font-menlo overflow-wrap-anywhere break-all text-[14px] font-normal not-italic leading-[20px]">
            {calldata}
          </p>
        </div>

        <div className="flex w-full gap-2">
          <p className="font-menlo min-w-[88px] text-[14px] font-normal not-italic leading-[20px]">
            Value:
          </p>
          <p className="text-secondary font-menlo text-[14px] font-normal not-italic leading-[20px]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};
