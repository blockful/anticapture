import { GetProposalQuery } from "@anticapture/graphql-client";

export const ProposalTimeline = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const now = Date.now() / 1000;
  const createdTime = parseInt(proposal.timestamp);
  const startTime = parseInt(proposal.startTimestamp);
  const endTime = parseInt(proposal.endTimestamp);

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

  const timelineItems = [
    {
      label: "Created",
      timestamp: createdTime,
      date: formatTimestamp(createdTime),
      status: getTimelineItemStatus(createdTime),
    },
    {
      label: startTime <= now ? "Started" : "Starts",
      timestamp: startTime,
      date: formatTimestamp(startTime),
      status: getTimelineItemStatus(startTime),
    },
    {
      label: endTime <= now ? "Ended" : "Ends",
      timestamp: endTime,
      date: formatTimestamp(endTime),
      status: getTimelineItemStatus(endTime),
    },
  ];

  const getTimelineItemBgColor = (index: number) => {
    // Find the last completed item index (this is the current state)
    const lastCompletedIndex = timelineItems.findLastIndex(
      (item) => item.status === "completed"
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
            <div className="flex flex-col">
              <p className={`font-roboto-mono text-[13px]`}>
                <span className="text-primary">{item.label}</span>{" "}
                <span className="text-secondary">on {item.date}</span>
              </p>
            </div>
          </div>
          {index < timelineItems.length - 1 && (
            <div className={`${getTimelineLineBgColor(index)} ml-[3px] h-5 w-0.5`} />
          )}
        </div>
      ))}
    </div>
  );
};
