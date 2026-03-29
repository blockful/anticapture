import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { ProposalDetails } from "@/features/governance/types";

interface ProposalTimelineProps {
  proposal: ProposalDetails;
  blockExplorerUrl?: string;
}

export const ProposalTimeline = ({
  proposal,
  blockExplorerUrl = "https://etherscan.io",
}: ProposalTimelineProps) => {
  const now = Date.now() / 1000;
  const createdTime = Number(proposal.timestamp);
  const startTime = Number(proposal.startTimestamp);
  const endTime = Number(proposal.endTimestamp);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimelineItemStatus = (timestamp: number) => {
    if (timestamp <= now) {
      return "completed";
    }
    return "pending";
  };

  const proposalStatus = proposal.status.toLowerCase();
  const isQueued =
    proposalStatus === "queued" ||
    proposalStatus === "pending_execution" ||
    proposalStatus === "executed";
  const isExecuted = proposalStatus === "executed";

  const timelineItems = [
    {
      label: "Created",
      timestamp: createdTime,
      date: formatTimestamp(createdTime),
      status: getTimelineItemStatus(createdTime),
      txLink: proposal.txHash
        ? `${blockExplorerUrl}/tx/${proposal.txHash}`
        : undefined,
    },
    {
      label: startTime <= now ? "Started" : "Starts",
      timestamp: startTime,
      date: formatTimestamp(startTime),
      status: getTimelineItemStatus(startTime),
      txLink: undefined,
    },
    {
      label: endTime <= now ? "Ended" : "Ends",
      timestamp: endTime,
      date: formatTimestamp(endTime),
      status: getTimelineItemStatus(endTime),
      txLink: undefined,
    },
    ...(isQueued
      ? [
          {
            label: "Queued",
            timestamp: endTime + 1,
            date: undefined as string | undefined,
            status: "completed" as const,
            txLink: undefined,
          },
        ]
      : []),
    ...(isExecuted
      ? [
          {
            label: "Executed",
            timestamp: endTime + 2,
            date: undefined as string | undefined,
            status: "completed" as const,
            txLink: undefined,
          },
        ]
      : []),
  ];

  const getTimelineItemBgColor = (index: number) => {
    // Find the last completed item index (this is the current state)
    const lastCompletedIndex = timelineItems.findLastIndex(
      (item) => item.status === "completed",
    );

    if (index < lastCompletedIndex) {
      // Past completed items - white
      return "bg-surface-action";
    } else if (index === lastCompletedIndex) {
      // Current state (last completed item) - orange/brand
      return "bg-link";
    } else {
      // Future pending items - gray
      return "bg-surface-hover";
    }
  };

  const getTimelineLineBgColor = (index: number) => {
    // The line at index i connects item[i] to item[i+1]
    // If the next item is completed, the line should be white (surface-action)
    // If the next item is pending (future), the line should be gray (surface-hover)
    const nextItem = timelineItems[index + 1];
    if (nextItem && nextItem.status === "completed") {
      return "bg-surface-action";
    }
    return "bg-surface-hover";
  };

  return (
    <div className="flex flex-col gap-0">
      {timelineItems.map((item, index) => (
        <div key={item.label}>
          <div className="flex items-center gap-2">
            {/* Timeline dot */}
            <div className="flex flex-col items-start">
              <div
                className={`size-2 rounded-full ${getTimelineItemBgColor(index)}`}
              />
            </div>

            {/* Timeline content */}
            <div className="flex items-center gap-1.5">
              <p className={`font-roboto-mono text-[13px]`}>
                <span className="text-primary">{item.label}</span>{" "}
                {item.date && (
                  <span className="text-secondary">on {item.date}</span>
                )}
              </p>
              {item.txLink && (
                <Link
                  href={item.txLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-primary transition-colors"
                >
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>
          {index < timelineItems.length - 1 && (
            <div
              className={`${getTimelineLineBgColor(index)} ml-[3px] h-5 w-0.5`}
            />
          )}
        </div>
      ))}
    </div>
  );
};
