export type RecipientPublishState =
  | "disconnected"
  | "below-threshold"
  | "eligible";

/**
 * Decides the recipient's publish capability for a shared draft:
 * - no/empty address  → "disconnected" (Publish opens the wallet modal)
 * - VP below threshold → "below-threshold" (Publish disabled)
 * - otherwise          → "eligible" (Publish active)
 */
export const getRecipientPublishState = ({
  address,
  votingPower,
  threshold,
}: {
  address: string | undefined;
  votingPower: bigint;
  threshold: bigint;
}): RecipientPublishState => {
  if (!address) return "disconnected";
  if (votingPower < threshold) return "below-threshold";
  return "eligible";
};
