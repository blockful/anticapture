"use client";

import { proposalQueryKey, proposalsQueryKey } from "@anticapture/client/hooks";
import type { ProposalPathParamsDaoEnumKey } from "@anticapture/client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Hourglass, PenLine, Zap } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Address, Hash } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import type { ProposalViewData } from "@/features/governance/types";
import {
  getStatusPollStep,
  STATUS_POLL_MS,
} from "@/features/governance/utils/proposalStatusPolling";
import {
  canRelayGovernanceAction,
  getRelayBlockedReason,
  relayGovernanceAction,
} from "@/features/governance/utils/relayGovernanceAction";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import {
  canStartSubmission,
  getModalEntryPoint,
  NOTHING_SENT,
  type ActionMode,
  type SettledSubmission,
  type SubmissionState,
} from "@/features/governance/utils/submissionState";
import {
  readSubmission,
  submissionKey,
  subscribeToSubmission,
  writeSubmission,
} from "@/features/governance/utils/submissionStore";
import { runWalletSubmission } from "@/features/governance/utils/walletSubmission";
import {
  executeProposal,
  queueProposal,
  type GovernanceAction,
} from "@/features/governance/utils/submitGovernanceAction";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import daoConfigByDaoId from "@/shared/dao-config";
import { useGaslessEnactment } from "@/shared/hooks/useGaslessRelayer";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import {
  getRelayerRevertedHash,
  isRelayerTransactionReverted,
  mapRelayerEnactmentError,
} from "@/shared/utils/gaslessRelayerError";

/**
 * "idle" lasts only while the relayer balance query settles. "choose" is
 * reached when the relayer can sponsor the action: the user picks between the
 * free path and their own wallet. Without a relayer the modal opens straight
 * into the wallet flow, as it always did.
 *
 * "ambiguous" is every outcome that is neither a success nor a failure: a
 * receipt that could not be read, a relayer that never answered, a send whose
 * response was lost. It offers no retry, since a second submission could
 * duplicate a governor call that is already on its way, and it shows an
 * explorer link only when a hash exists.
 */
type ActionStep =
  | "idle"
  | "choose"
  | "waiting-signature"
  | "relaying"
  | "pending-tx"
  | "success"
  | "ambiguous"
  | "error";

interface GovernanceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: GovernanceAction;
  proposal: ProposalViewData;
  daoId: DaoIdEnum;
}

const ACTION_COPY: Record<
  GovernanceAction,
  {
    title: string;
    verb: string;
    pastTense: string;
    walletStep: string;
    relayStep: string;
  }
> = {
  queue: {
    title: "Confirm Queue",
    verb: "Queue",
    pastTense: "queued",
    walletStep: "Confirm queuing in your wallet",
    relayStep: "Relayer submits the queue transaction (free)",
  },
  execute: {
    title: "Confirm Execution",
    verb: "Execute",
    pastTense: "executed",
    walletStep: "Confirm execution in your wallet",
    relayStep: "Relayer submits the execute transaction (free)",
  },
};

const REVERTED_MESSAGE =
  "The transaction was mined but reverted on-chain. The proposal state did not change.";
const CONNECT_WALLET_MESSAGE =
  "Connect a wallet to pay for this transaction yourself.";

const shortenHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

export const GovernanceActionModal = ({
  isOpen,
  onClose,
  action,
  proposal,
  daoId,
}: GovernanceActionModalProps) => {
  const [step, setStep] = useState<ActionStep>("idle");
  const [mode, setMode] = useState<ActionMode>("wallet");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  // The action a submission is still waiting to see indexed. Non-null while
  // the proposal is being refetched; cleared once the action's successor
  // status arrives or the attempt budget runs out.
  const [awaitedAction, setAwaitedAction] = useState<GovernanceAction | null>(
    null,
  );

  // What is known about this proposal action, held outside the component so
  // it survives the route unmounting while a request is still unresolved. The
  // store is read synchronously wherever a decision depends on it, because
  // the check that stops a second submission cannot wait for a render.
  const stateKey = submissionKey(daoId, proposal.id, action);
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToSubmission(stateKey, onChange),
    [stateKey],
  );
  const readState = useCallback(() => readSubmission(stateKey), [stateKey]);
  const submission = useSyncExternalStore(subscribe, readState, readState);

  const moveSubmission = useCallback(
    (next: SubmissionState) => writeSubmission(stateKey, next),
    [stateKey],
  );

  // True once a submission was started from this mount. A mount that inherits
  // someone else's request renders from the store instead, since the run that
  // owns the screen belongs to a component that may be gone.
  const ownsRunRef = useRef(false);

  // Claims the action for one submission. Dismissing the modal never releases
  // it: the request carries on, and a wallet transaction started from a
  // reopened modal would race whatever is already out there.
  const startSubmission = useCallback(
    (mode: ActionMode): boolean => {
      if (!canStartSubmission(readSubmission(stateKey))) return false;
      ownsRunRef.current = true;
      moveSubmission({ kind: "in-flight", mode });
      return true;
    },
    [moveSubmission, stateKey],
  );

  // Frees the action unless the submission ended somewhere no retry is safe.
  // What it sent is recorded with it, because a mount that inherits this
  // state never saw the run and has to know whether a transaction exists.
  const finishSubmission = useCallback(
    (settled: SettledSubmission) => {
      const current = readSubmission(stateKey);
      if (current.kind !== "in-flight") return;
      moveSubmission({ kind: "done", mode: current.mode, ...settled });
    },
    [moveSubmission, stateKey],
  );

  // Refetches issued for the current polling run, the immediate one at the
  // start included. Held in a ref so a status that changes mid-run restarts
  // the timer without refilling the budget.
  const pollAttemptsRef = useRef(0);

  const { address } = useAccount();
  const chain = daoConfigByDaoId[daoId].daoOverview.chain;
  const { data: walletClient } = useWalletClient({ chainId: chain.id });
  const publicClient = usePublicClient({ chainId: chain.id });
  const queryClient = useQueryClient();

  const { isAvailable: isGaslessAvailable, isLoading: isGaslessLoading } =
    useGaslessEnactment(daoId);
  const relayBlockedReason = getRelayBlockedReason(action, proposal.status);
  const canRelay =
    isGaslessAvailable && canRelayGovernanceAction(action, proposal.status);

  const copy = ACTION_COPY[action];
  const explorerBaseUrl = chain.blockExplorers?.default?.url;

  const refreshProposal = useCallback(() => {
    const daoKey = daoId.toLowerCase() as ProposalPathParamsDaoEnumKey;
    void queryClient.invalidateQueries({
      queryKey: proposalQueryKey(daoKey, proposal.id),
    });
    void queryClient.invalidateQueries({
      queryKey: proposalsQueryKey(daoKey),
    });
  }, [queryClient, daoId, proposal.id]);

  // Keep refetching until the submitted action's own successor status is
  // indexed. Any other status, including a transient one the API serves when
  // its RPC reads fail, keeps the poll alive. Runs independently of the modal
  // being open, so a user who closes right after the receipt still gets the
  // page updated.
  useEffect(() => {
    if (awaitedAction === null) return;

    const pollStep = () =>
      getStatusPollStep({
        action: awaitedAction,
        proposalStatus: proposal.status,
        attempts: pollAttemptsRef.current,
      });

    if (pollStep() !== "keep-polling") {
      setAwaitedAction(null);
      return;
    }

    const interval = setInterval(() => {
      // Checked against the refetches already issued, then counted, so the
      // budget covers the immediate one below as well as these.
      if (pollStep() !== "keep-polling") {
        setAwaitedAction(null);
        return;
      }
      pollAttemptsRef.current += 1;
      refreshProposal();
    }, STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [awaitedAction, proposal.status, refreshProposal]);

  const startStatusPolling = useCallback(() => {
    // This first refetch counts towards the budget, so the run is exactly
    // STATUS_POLL_MAX_ATTEMPTS refetches spanning the two minutes promised.
    pollAttemptsRef.current = 1;
    setAwaitedAction(action);
    refreshProposal();
  }, [action, refreshProposal]);

  // Terminal for this action: the page keeps polling so it updates if the
  // transaction does land, the screen shows whatever is known about it, and
  // no further submission can start from this modal.
  const showAmbiguousOutcome = useCallback(
    (mode: ActionMode, hash: Hash | null) => {
      // The screen is painted by the effect that follows the store, so this
      // records the outcome once and every mount renders it the same way.
      moveSubmission({ kind: "ambiguous", mode, hash });
      startStatusPolling();
    },
    [moveSubmission, startStatusPolling],
  );

  const runWalletAction = useCallback(async () => {
    if (!address || !walletClient) return;
    if (!startSubmission("wallet")) return;

    setMode("wallet");
    setError(null);
    setTxHash(null);
    setStep("waiting-signature");

    let settled: SettledSubmission = NOTHING_SENT;

    try {
      const handler = action === "queue" ? queueProposal : executeProposal;
      const targets = proposal.targets ?? [];
      const values = proposal.values ?? [];
      const calldatas = proposal.calldatas ?? [];
      const validIndices = targets.reduce<number[]>((acc, t, i) => {
        if (
          t !== null &&
          values[i] !== null &&
          (calldatas[i] ?? null) !== null
        ) {
          acc.push(i);
        }
        return acc;
      }, []);
      const outcome = await runWalletSubmission((progress) =>
        handler(
          validIndices.map((i) => targets[i] as Address),
          validIndices.map((i) => values[i] as string),
          validIndices.map((i) => calldatas[i] as Address),
          proposal.description ?? "",
          address,
          daoId,
          walletClient,
          {
            onSendAttempt: progress.onSendAttempt,
            onBroadcast: (hash) => {
              progress.onBroadcast(hash);
              setTxHash(hash);
              setStep("pending-tx");
            },
          },
          proposal.id,
        ),
      );

      if (outcome.status === "ambiguous") {
        // The transaction may be on its way, with or without a hash to show
        // for it. The proposal is polled exactly as it is on success, and the
        // state stays terminal so nothing here can duplicate the call.
        showAmbiguousOutcome("wallet", outcome.hash);
        return;
      }
      settled = { sent: true, hash: outcome.hash };
      if (outcome.status === "reverted") {
        setTxHash(outcome.hash);
        setError(REVERTED_MESSAGE);
        setStep("error");
        return;
      }
      // A result that lands after the modal was closed still repaints it: the
      // screen is the one the user comes back to if they reopen before the
      // submission settles, and the page is refreshed either way.
      showCustomToast(`Proposal ${copy.pastTense} successfully!`, "success");
      startStatusPolling();
      setTxHash(outcome.hash);
      setStep("success");
    } catch (err) {
      // Only pre-broadcast failures reach here: a rejected signature or a
      // simulation revert sent nothing, so retrying is safe.
      const message =
        err instanceof Error
          ? (err.message.split("\n")[0]?.slice(0, 120) ?? "Action failed.")
          : "Action failed.";
      setError(message);
      setStep("error");
    } finally {
      finishSubmission(settled);
    }
  }, [
    address,
    walletClient,
    action,
    proposal,
    daoId,
    copy.pastTense,
    startStatusPolling,
    startSubmission,
    finishSubmission,
    showAmbiguousOutcome,
  ]);

  const runGaslessAction = useCallback(async () => {
    if (!startSubmission("gasless")) return;

    setMode("gasless");
    setError(null);
    setTxHash(null);
    setStep("relaying");

    let settled: SettledSubmission = NOTHING_SENT;

    try {
      const outcome = await relayGovernanceAction({
        action,
        daoId,
        proposalId: proposal.id,
        publicClient,
        onTxSubmitted: (hash) => {
          setTxHash(hash);
          setStep("pending-tx");
        },
      });

      if (outcome.status === "success" || outcome.status === "reverted") {
        settled = { sent: true, hash: outcome.hash };
      }
      if (outcome.status === "success") {
        showCustomToast(`Proposal ${copy.pastTense} successfully!`, "success");
        startStatusPolling();
        setStep("success");
        return;
      }
      if (outcome.status === "reverted") {
        setError(REVERTED_MESSAGE);
        setStep("error");
        return;
      }
      // "unconfirmed" carries a hash and "unknown" does not, but neither says
      // whether the governor call landed, so both are the same ambiguous
      // terminal state: poll the proposal and offer no retry that could
      // duplicate a relayed transaction already on its way.
      showAmbiguousOutcome("gasless", outcome.hash);
    } catch (err) {
      // The relayer answered with a definitive rejection or a revert, so
      // nothing is pending and the error path with its retry is correct. A
      // revert names its transaction in the message, which is the only place
      // the hash appears, so the explorer link matches the wallet path.
      console.error(err);
      const revertedHash = getRelayerRevertedHash(err);
      settled = {
        sent: isRelayerTransactionReverted(err),
        hash: revertedHash,
      };
      setTxHash(revertedHash);
      setError(mapRelayerEnactmentError(err, action));
      setStep("error");
    } finally {
      finishSubmission(settled);
    }
  }, [
    action,
    daoId,
    proposal.id,
    publicClient,
    copy.pastTense,
    startStatusPolling,
    startSubmission,
    finishSubmission,
    showAmbiguousOutcome,
  ]);

  // Follows the store for anything this mount did not start. An ambiguous
  // outcome always repaints, including the one recorded by the run that owns
  // the screen, so the two can never drift apart; the rest only matters to a
  // mount that inherited a request and cannot be told how it ended by the
  // component that made it.
  useEffect(() => {
    if (submission.kind === "ambiguous") {
      setMode(submission.mode);
      setTxHash(submission.hash);
      setStep("ambiguous");
      return;
    }
    if (ownsRunRef.current) return;
    if (submission.kind === "in-flight") {
      setMode(submission.mode);
      setStep(submission.mode === "gasless" ? "relaying" : "waiting-signature");
      return;
    }
    if (submission.kind === "done" && submission.sent) {
      // A transaction went out and the mount that watched it is gone, taking
      // its polling with it. `done` does not record whether it was mined or
      // reverted, so this mount claims neither: it shows the transaction, no
      // action button, and picks the watch back up so the page still catches
      // up on its own. The budget starts fresh, which is the right reading of
      // a user who has just come back to look.
      setMode(submission.mode);
      setTxHash(submission.hash);
      setStep("ambiguous");
      startStatusPolling();
      return;
    }
    // Nothing was ever sent, so the modal goes back through its entry point
    // and the action is offered again.
    setHasStarted(false);
  }, [submission, startStatusPolling]);

  const failWithoutWallet = useCallback((message: string) => {
    setMode("wallet");
    setError(message);
    setStep("error");
  }, []);

  // Opening decides the entry point once: with a funded relayer the user gets
  // to choose, otherwise the wallet flow starts on its own as before. While
  // the balance query settles the modal shows a neutral loading state instead
  // of a wallet prompt that is not actually in flight.
  useEffect(() => {
    if (!isOpen) {
      setHasStarted(false);
      return;
    }
    if (hasStarted || isGaslessLoading) return;
    setHasStarted(true);

    switch (
      getModalEntryPoint({
        submission,
        isGaslessAvailable,
        hasAddress: Boolean(address),
        hasWalletClient: Boolean(walletClient),
      })
    ) {
      // Reopened on top of a submission that is still in flight. Its screen
      // was left standing when the modal closed and its result will land
      // there, so nothing is offered that could race it.
      case "mirror-submission":
        return;
      // Reopened after an ambiguous outcome. The screen is rebuilt from the
      // recorded outcome rather than trusted to have survived, and it offers
      // no way to submit again.
      case "ambiguous-outcome":
        // The screen is rebuilt by the effect that follows the store, which
        // also covers an outcome recorded by a mount that is already gone.
        return;
      case "choose":
        setStep("choose");
        return;
      case "connect-wallet":
        failWithoutWallet(CONNECT_WALLET_MESSAGE);
        return;
      case "switch-network":
        failWithoutWallet(
          `Please switch your wallet to the ${chain.name} network.`,
        );
        return;
      case "wallet":
        void runWalletAction();
        return;
    }
  }, [
    isOpen,
    hasStarted,
    isGaslessLoading,
    isGaslessAvailable,
    address,
    walletClient,
    chain.name,
    runWalletAction,
    failWithoutWallet,
    submission,
  ]);

  const handleUseWallet = () => {
    // No screen offering this button renders while a submission is pending or
    // ambiguous, but the check keeps that invariant local to the action
    // rather than spread across the render branches.
    if (!canStartSubmission(readSubmission(stateKey))) return;
    if (!address) {
      failWithoutWallet(CONNECT_WALLET_MESSAGE);
      return;
    }
    if (!walletClient) {
      failWithoutWallet(
        `Please switch your wallet to the ${chain.name} network.`,
      );
      return;
    }
    void runWalletAction();
  };

  const handleClose = () => {
    // A submission that is unresolved or ambiguous keeps its screen: it may
    // yet land, so reopening has to show what is known rather than offer a
    // submission that could duplicate it. The modal resets only in the states
    // where starting another one is allowed anyway.
    if (canStartSubmission(readSubmission(stateKey))) {
      setStep("idle");
      setMode("wallet");
      setError(null);
      setTxHash(null);
    }
    setHasStarted(false);
    onClose();
  };

  const isGaslessRun = mode === "gasless";
  const isFinished = step === "success" || step === "ambiguous";

  const txHashRow = txHash && (
    <div className="flex items-start gap-2">
      <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
        Transaction
      </span>
      {explorerBaseUrl ? (
        <a
          href={`${explorerBaseUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link inline-flex items-center gap-1 break-all text-sm leading-5 hover:underline"
        >
          {shortenHash(txHash)}
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      ) : (
        <span className="text-primary break-all text-sm leading-5">
          {txHash}
        </span>
      )}
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title={copy.title}
    >
      {/* Proposal info */}
      <div className="flex flex-col gap-2 pb-4">
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Proposal ID
          </span>
          <span className="text-primary break-all text-sm leading-5">
            {proposal.id}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-secondary w-32 shrink-0 text-xs font-medium leading-5">
            Proposal name
          </span>
          <span className="text-primary text-sm leading-5">
            {proposal.title}
          </span>
        </div>
      </div>

      {step === "idle" ? (
        <div className="text-secondary flex items-center gap-2 py-2 text-sm">
          <SpinIcon className="text-warning size-4 animate-spin" />
          Checking whether this action can be sponsored...
        </div>
      ) : step === "choose" ? (
        <div className="flex flex-col gap-4">
          {canRelay ? (
            <InlineAlert
              variant="success"
              text={`This ${action} is free. The relayer pays the gas, so no wallet transaction is needed.`}
            />
          ) : (
            <InlineAlert
              variant="warning"
              text={
                relayBlockedReason ??
                `The relayer can't ${action} this proposal right now.`
              }
            />
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleUseWallet}>
              Use my wallet
            </Button>
            <Button
              disabled={!canRelay}
              onClick={() => void runGaslessAction()}
              data-ph-event={`proposal_${action}_gasless`}
              data-ph-source="gov_fe"
            >
              <Zap className="size-3.5" />
              {copy.verb} for free
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Stepper */}
          <div className="border-border-default flex flex-col gap-1.5 border p-3">
            <StepRow
              done={
                step === "success" ||
                step === "pending-tx" ||
                (step === "ambiguous" && txHash !== null)
              }
              active={step === "waiting-signature" || step === "relaying"}
              icon={
                isGaslessRun ? (
                  <Zap className="text-primary size-3.5" />
                ) : (
                  <PenLine className="text-primary size-3.5" />
                )
              }
              label={isGaslessRun ? copy.relayStep : copy.walletStep}
              error={step === "error" ? error : undefined}
            />

            <DividerDefault isVertical className="ml-3.5 h-6 w-0.5" />

            <StepRow
              done={step === "success"}
              active={step === "pending-tx"}
              icon={<Hourglass className="text-primary size-3.5" />}
              label="Wait for transaction to complete"
            />
          </div>

          {txHashRow}

          {step === "ambiguous" && (
            <InlineAlert
              variant="warning"
              text={
                txHash
                  ? "The transaction was sent but is not confirmed yet. Follow it on the explorer. This page updates on its own once the action is indexed."
                  : `Transaction may have been sent. It is unclear whether the ${action} reached the network, so there is no safe retry here. This page keeps checking the proposal status.`
              }
            />
          )}

          {step === "error" && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {isGaslessRun ? (
                <Button onClick={handleUseWallet}>Try with my wallet</Button>
              ) : (
                <>
                  {canRelay && (
                    <Button
                      variant="outline"
                      onClick={() => void runGaslessAction()}
                    >
                      <Zap className="size-3.5" />
                      Try for free
                    </Button>
                  )}
                  <Button onClick={handleUseWallet}>Try again</Button>
                </>
              )}
            </div>
          )}

          {isFinished && (
            <div className="flex items-center justify-end">
              <Button onClick={handleClose}>
                {step === "success" ? "Done" : "Close"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

interface StepRowProps {
  done: boolean;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  error?: string | null;
}

const StepRow = ({ done, active, icon, label, error }: StepRowProps) => {
  const getBackgroundColor = () => {
    if (done) return "bg-surface-opacity-success";
    if (active) return "bg-primary";
    return "bg-border-default";
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          {active && (
            <SpinIcon className="text-warning absolute inset-0 size-8 animate-spin" />
          )}
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full",
              getBackgroundColor(),
            )}
          >
            <div className="border-border-default flex items-center justify-center rounded-full border p-1">
              {done ? <Check className="text-success size-3.5" /> : icon}
            </div>
          </div>
        </div>
        <p className="text-primary text-sm leading-5">{label}</p>
      </div>

      {error && (
        <p className="text-error ml-11 break-words text-xs leading-4">
          {error}
        </p>
      )}
    </div>
  );
};
