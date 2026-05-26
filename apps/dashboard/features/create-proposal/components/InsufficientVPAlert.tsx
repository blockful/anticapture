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
    text={`Your voting power is below the ${threshold} ${tokenSymbol} minimum required to submit. You can still save a draft and share it with a delegate who can submit it on your behalf.`}
  />
);
