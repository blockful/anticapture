"use client";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";

interface InsufficientVPAlertProps {
  threshold: string;
  tokenSymbol: string;
}

export const InsufficientVPAlert = ({
  threshold,
  tokenSymbol,
}: InsufficientVPAlertProps) => (
  <InlineAlert
    variant="warning"
    text={`Your current voting power is insufficient to submit a proposal. A minimum of ${threshold} ${tokenSymbol} is required.`}
  />
);
