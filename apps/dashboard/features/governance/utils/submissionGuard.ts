/** How a submission was sent: the user's own wallet, or the relayer. */
export type ActionMode = "wallet" | "gasless";

/**
 * Single-flight guard for one proposal action.
 *
 * The guard is released when the submission settles and never when the modal
 * closes. A relayer request that outlives its modal may still broadcast, so a
 * user who dismisses and reopens must not be able to send a wallet
 * transaction that races it: both would target the same governor call and the
 * loser pays gas for a revert.
 */
export interface SubmissionGuard {
  /** Claims the guard. False when a submission is already in flight. */
  begin: (mode: ActionMode) => boolean;
  /** Releases it once the submission settles, dismissed or not. */
  end: () => void;
  /** How the in-flight submission was sent, or null when idle. */
  inFlight: () => ActionMode | null;
}

export const createSubmissionGuard = (): SubmissionGuard => {
  let mode: ActionMode | null = null;

  return {
    begin: (nextMode) => {
      if (mode !== null) return false;
      mode = nextMode;
      return true;
    },
    end: () => {
      mode = null;
    },
    inFlight: () => mode,
  };
};

/**
 * Where an opening modal should land.
 *
 * "mirror-submission" is the dismissed-and-reopened case: the submission that
 * is still in flight keeps its own in-progress screen, so the modal shows no
 * action buttons and its result lands on the screen the user came back to.
 */
export type ModalEntryPoint =
  | "mirror-submission"
  | "choose"
  | "wallet"
  | "connect-wallet"
  | "switch-network";

interface ModalEntryInput {
  /** The guard's `inFlight()` reading at the moment the modal opens. */
  inFlightSubmission: ActionMode | null;
  isGaslessAvailable: boolean;
  hasAddress: boolean;
  hasWalletClient: boolean;
}

export const getModalEntryPoint = ({
  inFlightSubmission,
  isGaslessAvailable,
  hasAddress,
  hasWalletClient,
}: ModalEntryInput): ModalEntryPoint => {
  if (inFlightSubmission !== null) return "mirror-submission";
  if (isGaslessAvailable) return "choose";
  if (!hasAddress) return "connect-wallet";
  if (!hasWalletClient) return "switch-network";
  return "wallet";
};
