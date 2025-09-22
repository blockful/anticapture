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
    // Created is always primary
    if (index === 0) return "bg-primary";

    // Find the first pending item (after created)
    const firstPendingIndex = timelineItems.findIndex(
      (item, i) => i > 0 && item.status === "pending",
    );

    if (firstPendingIndex === -1) {
      // All items are completed
      return "bg-primary";
    }

    if (index < firstPendingIndex) {
      // Completed items
      return "bg-primary";
    } else if (index === firstPendingIndex) {
      // Next item to be completed
      return "bg-link";
    } else {
      // Future items
      return "bg-secondary";
    }
  };

  return (
    <div className="flex flex-col gap-0">
      {timelineItems.map((item, index) => (
        <>
          <div key={item.label} className="flex items-center gap-2">
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
            <div className="bg-secondary ml-[3px] h-5 w-0.5" />
          )}
        </>
      ))}
    </div>
  );
};
