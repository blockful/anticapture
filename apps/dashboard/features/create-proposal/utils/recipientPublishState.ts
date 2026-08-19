import { meetsProposalThreshold } from "@/features/create-proposal/utils/submitProposalRequest";
import { type DaoIdEnum } from "@/shared/types/daos";

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
  daoId,
  address,
  votingPower,
  threshold,
}: {
  daoId: DaoIdEnum;
  address: string | undefined;
  votingPower: bigint;
  threshold: bigint;
}): RecipientPublishState => {
  if (!address) return "disconnected";
  if (!meetsProposalThreshold(daoId, votingPower, threshold))
    return "below-threshold";
  return "eligible";
};
