import { BlankSlate } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { Inbox } from "lucide-react";
import { useState } from "react";

export const ActionsTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="text-primary flex flex-col gap-3 lg:p-4 py-4">
      {proposal.targets.length === 0 ? (
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No actions found"
        />
      ) : (
        proposal.targets.map((target, index) => (
          <ActionItem
            key={index}
            index={index}
            target={proposal.targets[index]}
            value={proposal.values[index]}
            calldata={proposal.calldatas[index]}
          />
        ))
      )}
    </div>
  );
};

interface ActionItemProps {
  target: string | null;
  value: string | null;
  calldata: string | null;
  index: number;
}

// Approximate threshold for 5 lines of monospace hex data
const CALLDATA_TRUNCATE_LENGTH = 200;

const ActionItem = ({ target, value, calldata, index }: ActionItemProps) => {
  const [isCalldataExpanded, setIsCalldataExpanded] = useState(false);
  const isCalldataLong = (calldata?.length ?? 0) > CALLDATA_TRUNCATE_LENGTH;

  return (
    <div className="border-border-default flex w-full flex-col gap-2 border">
      <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 p-3">
        <div>
          <p className="text-primary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider">
            // Action {index + 1}
          </p>
        </div>
        <DefaultLink
          href={`https://etherscan.io/address/${target}`}
          openInNewTab
          className="text-secondary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider"
        >
          Contract
        </DefaultLink>
      </div>

      <div className="flex w-full flex-col gap-2 p-3">
        <div className="flex w-full gap-2">
          <p className="font-mono min-w-[88px] text-sm font-normal not-italic leading-5">
            target:
          </p>
          <p className="text-secondary font-mono text-sm font-normal not-italic leading-5">
            {target}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full gap-2">
            <p className="font-mono min-w-[88px] text-sm font-normal not-italic leading-5">
              calldata:
            </p>
            <p
              className={`text-secondary font-mono overflow-wrap-anywhere break-all text-sm font-normal not-italic leading-5 ${
                isCalldataLong && !isCalldataExpanded ? "line-clamp-5" : ""
              }`}
            >
              {calldata}
            </p>
          </div>
          {isCalldataLong && (
            <button
              onClick={() => setIsCalldataExpanded(!isCalldataExpanded)}
              className="text-link hover:text-link/80 ml-[96px] cursor-pointer self-start font-mono text-[13px] font-medium uppercase leading-none tracking-wider transition-colors duration-300"
            >
              {isCalldataExpanded ? "See less" : "See more"}
            </button>
          )}
        </div>

        <div className="flex w-full gap-2">
          <p className="font-mono min-w-[88px] text-sm font-normal not-italic leading-5">
            value:
          </p>
          <p className="text-secondary font-mono text-sm font-normal not-italic leading-5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};
