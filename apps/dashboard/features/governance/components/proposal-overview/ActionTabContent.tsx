"use client";

import { Inbox } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useDecodeCalldata } from "@/features/governance/hooks/useDecodeCalldata";
import type { ProposalDetails } from "@/features/governance/types";
import { BlankSlate, Button } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const ETH_ADDRESS_REGEX = /(0x[0-9a-fA-F]{40})(?![0-9a-fA-F])/g;

const isEthAddress = (segment: string) => /^0x[0-9a-fA-F]{40}$/.test(segment);

const CalldataWithEns = ({ text }: { text: string }) => {
  const segments = text.split(ETH_ADDRESS_REGEX).filter(Boolean);

  return (
    <>
      {segments.map((segment, i) =>
        isEthAddress(segment) ? (
          <EnsAvatar
            key={`ens-${i}`}
            address={segment as `0x${string}`}
            showAvatar={false}
            nameClassName="text-secondary font-mono text-sm font-normal not-italic leading-5"
          />
        ) : (
          <span key={`text-${i}`}>{segment}</span>
        ),
      )}
    </>
  );
};

export const ActionsTabContent = ({
  proposal,
}: {
  proposal: ProposalDetails;
}) => {
  const { daoId } = useParams<{ daoId: string }>();
  const daoIdKey = daoId?.toUpperCase() as DaoIdEnum;
  const blockExplorerUrl =
    daoConfigByDaoId[daoIdKey]?.daoOverview?.chain?.blockExplorers?.default
      ?.url ?? "https://etherscan.io";

  return (
    <div className="text-primary flex flex-col gap-3 py-4 lg:p-4">
      {proposal.targets.length === 0 ? (
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No actions found"
        />
      ) : (
        proposal.targets.map((_, index) => (
          <ActionItem
            key={index}
            index={index}
            target={proposal.targets[index]}
            value={proposal.values[index]}
            calldata={proposal.calldatas[index]}
            blockExplorerUrl={blockExplorerUrl}
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
  blockExplorerUrl: string;
}
const ActionItem = ({
  target,
  value,
  calldata,
  index,
  blockExplorerUrl,
}: ActionItemProps) => {
  const [isDecoded, setIsDecoded] = useState(true);

  const { data: decodedCalldata, isLoading } = useDecodeCalldata({
    calldata,
    enabled: isDecoded,
  });

  const handleToggleDecode = () => {
    setIsDecoded(!isDecoded);
  };

  const displayCalldata =
    isDecoded && decodedCalldata ? decodedCalldata : calldata;
  return (
    <div className="border-border-default flex w-full flex-col gap-2 border">
      <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 p-3">
        <div>
          <p className="text-primary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider">
            // Action {index + 1}
          </p>
        </div>
        <DefaultLink
          href={`${blockExplorerUrl}/address/${target}`}
          openInNewTab
          className="text-secondary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider"
        >
          Contract
        </DefaultLink>
      </div>
      <div className="flex w-full flex-col gap-3 p-3">
        <div className="flex w-full gap-2">
          <p className="min-w-22 font-mono text-sm font-normal not-italic leading-5">
            target:
          </p>
          <DefaultLink
            href={`${blockExplorerUrl}/address/${target}`}
            openInNewTab
            className="font-mono text-sm font-normal not-italic leading-5"
          >
            {target && (
              <EnsAvatar
                address={target as `0x${string}`}
                showAvatar={false}
                nameClassName="text-secondary font-mono text-sm font-normal not-italic leading-5"
              />
            )}
          </DefaultLink>
        </div>
        <div className="flex w-full gap-2">
          <p className="min-w-22 shrink-0 font-mono text-sm font-normal not-italic leading-5">
            calldata:
          </p>
          <div className="border-border-contrast relative min-w-0 flex-1 border">
            <div className="scrollbar-thin max-h-62 overflow-y-auto p-3 pb-9">
              {isDecoded && !isLoading && decodedCalldata ? (
                <div className="text-secondary whitespace-pre-wrap font-mono text-sm font-normal not-italic leading-5">
                  <CalldataWithEns text={decodedCalldata} />
                </div>
              ) : (
                <p
                  className={`text-secondary break-all font-mono text-sm font-normal not-italic leading-5 ${isLoading ? "animate-pulse" : ""}`}
                >
                  {displayCalldata}
                </p>
              )}
            </div>
            {calldata && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDecode}
                loading={isLoading}
                className="bg-surface-default border-border-contrast absolute bottom-2 right-2 border"
              >
                {isDecoded ? "Encode" : "Decode"}
              </Button>
            )}
          </div>
        </div>
        <div className="flex w-full gap-2">
          <p className="min-w-22 font-mono text-sm font-normal not-italic leading-5">
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
