"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAccount } from "wagmi";
import { formatUnits, zeroAddress } from "viem";
import { parseAsStringEnum, useQueryState } from "nuqs";

import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { getWhitelabelBasePath } from "@/shared/utils/whitelabel";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { useLogin } from "@/shared/services/auth/LoginProvider";
import { useWalletPrompt } from "@/shared/services/auth/useWalletPrompt";
import { getDraft } from "@/shared/services/user-api/draftsClient";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { copyDraftShareUrl } from "@/features/create-proposal/utils/draftShareUrl";
import {
  BODY_CHAR_LIMIT,
  BODY_PLACEHOLDER,
} from "@/features/create-proposal/constants";
import {
  ProposalFormSchema,
  type ProposalFormValues,
} from "@/features/create-proposal/schema";
import { useDrafts } from "@/features/create-proposal/hooks/useDrafts";
import { useProposalVotingPower } from "@/features/create-proposal/hooks/useProposalVotingPower";
import { useProposalThreshold } from "@/features/create-proposal/hooks/useProposalThreshold";
import { usePublishProposal } from "@/features/create-proposal/hooks/usePublishProposal";
import { BodyField } from "@/features/create-proposal/components/BodyField";
import { ProposalFormNavBar } from "@/features/create-proposal/components/ProposalFormNavBar";
import { InsufficientVPAlert } from "@/features/create-proposal/components/InsufficientVPAlert";
import { NavigationGuard } from "@/features/create-proposal/components/NavigationGuard";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { DraftViewToggle } from "@/features/create-proposal/components/preview/DraftViewToggle";
import { DraftPreview } from "@/features/create-proposal/components/preview/DraftPreview";
import { draftPreviewCopy } from "@/features/create-proposal/utils/draftThresholdCopy";
import { getRecipientPublishState } from "@/features/create-proposal/utils/recipientPublishState";
import { cloneAction } from "@/features/create-proposal/utils/cloneAction";
import { ActionsList } from "@/features/create-proposal/components/actions/ActionsList";
import { ActionsPlaceholderCard } from "@/features/create-proposal/components/actions/ActionsPlaceholderCard";
import { AddTransferModal } from "@/features/create-proposal/components/modals/AddTransferModal";
import { AddCustomActionModal } from "@/features/create-proposal/components/modals/AddCustomActionModal";
import { DeleteActionModal } from "@/features/create-proposal/components/modals/DeleteActionModal";
import { PublishModal } from "@/features/create-proposal/components/modals/PublishModal";
import { ProposalSubmittedModal } from "@/features/create-proposal/components/modals/ProposalSubmittedModal";
import { SubmissionFailedModal } from "@/features/create-proposal/components/modals/SubmissionFailedModal";
import { InsufficientVPModal } from "@/features/create-proposal/components/modals/InsufficientVPModal";
import {
  takeImportedProposal,
  type ImportedProposal,
} from "@/features/create-proposal/utils/importHandoff";
import type {
  CustomAction,
  ERC20TransferAction,
  EthTransferAction,
  ProposalAction,
} from "@/features/create-proposal/types";

function toFormAction(
  action: ProposalAction,
): ProposalFormValues["actions"][number] {
  if (action.type === "custom") {
    return { ...action, abi: [...action.abi] };
  }
  return action;
}

const DEFAULTS: ProposalFormValues = {
  title: "",
  discussionUrl: "",
  body: BODY_PLACEHOLDER,
  actions: [],
};

type ProposalCreationFormProps = {
  isWhitelabelRoute?: boolean;
};

export const ProposalCreationForm = ({
  isWhitelabelRoute = false,
}: ProposalCreationFormProps) => {
  const { daoId: daoIdParam } = useParams();
  const daoId = (daoIdParam as string).toLowerCase();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  const pathname = usePathname();
  const basePath = getWhitelabelBasePath({ daoId: daoIdEnum, pathname });
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams?.get("draftId") ?? undefined;
  const { address } = useAccount();
  const { openLogin } = useLogin();
  const { promptWalletConnection } = useWalletPrompt();
  const drafts = useDrafts(daoId);

  const vp = useProposalVotingPower(daoId, address || zeroAddress);

  const {
    threshold,
    isLoading: isLoadingThreshold,
    thresholdFormatted,
  } = useProposalThreshold(daoId);
  const publisher = usePublishProposal();

  const [viewParam, setView] = useQueryState(
    "view",
    parseAsStringEnum<"editor" | "preview">(["editor", "preview"]),
  );
  const view = viewParam ?? (draftId ? "preview" : "editor");

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(ProposalFormSchema),
    defaultValues: DEFAULTS,
    mode: "onChange",
  });

  const actionsArray = useFieldArray({
    control: form.control,
    name: "actions",
  });

  const revalidateActions = () => {
    void form.trigger("actions");
  };

  const hydratedDraftIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!draftId) return;
    if (hydratedDraftIdRef.current === draftId) return;

    const d = drafts.getDraft(draftId);
    if (d) {
      form.reset({
        title: d.title,
        discussionUrl: d.discussionUrl,
        body: d.body,
        actions: d.actions.map(toFormAction),
      });
      setSharedAuthor(undefined);
      setCurrentDraftId(draftId);
      setBodyVersion((v) => v + 1);
      hydratedDraftIdRef.current = draftId;
      setHydratedDraftId(draftId);
      return;
    }

    if (drafts.isLoading) return;

    let cancelled = false;

    void getDraft(draftId)
      .then((shared) => {
        if (cancelled) return;
        hydratedDraftIdRef.current = draftId;
        if (!shared) return;
        if (shared.daoId !== daoId) {
          showCustomToast("This draft belongs to another DAO", "error");
          setCurrentDraftId(undefined);
          return;
        }
        setSharedAuthor(shared.authorAddress ?? undefined);
        form.reset({
          title: shared.title,
          discussionUrl: shared.discussionUrl,
          body: shared.body,
          actions: shared.actions.map((a) => toFormAction(a as ProposalAction)),
        });
        setCurrentDraftId(shared.isOwner ? draftId : undefined);
        setBodyVersion((v) => v + 1);
        setHydratedDraftId(draftId);
      })
      .catch(() => {
        if (cancelled) return;
        showCustomToast("Could not load the shared draft", "error");
      });

    return () => {
      cancelled = true;
    };
  }, [draftId, drafts.drafts, drafts.isLoading]);

  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(
    draftId,
  );
  const [sharedAuthor, setSharedAuthor] = useState<string | undefined>(
    undefined,
  );
  const [hydratedDraftId, setHydratedDraftId] = useState<string | undefined>(
    undefined,
  );
  const [bodyVersion, setBodyVersion] = useState(0);
  const [transferOpen, setTransferOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editActionIndex, setEditActionIndex] = useState<number | null>(null);
  const [deleteActionIndex, setDeleteActionIndex] = useState<number | null>(
    null,
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [submittedOpen, setSubmittedOpen] = useState(false);
  const [failedOpen, setFailedOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const pendingDraftStashKey = `anticapture:pending-draft:${daoId}`;
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(pendingDraftStashKey);
    } catch {
      return;
    }
    if (!raw) return;
    if (draftId && hydratedDraftId !== draftId) return;
    try {
      form.reset(JSON.parse(raw) as ProposalFormValues, {
        keepDefaultValues: true,
      });
      setBodyVersion((v) => v + 1);
    } catch {
      // A corrupt stash is dropped, not surfaced: the form is usable without it.
    } finally {
      try {
        sessionStorage.removeItem(pendingDraftStashKey);
      } catch {
        // Storage that refuses this refused the write too.
      }
    }
  }, [pendingDraftStashKey, draftId, hydratedDraftId]);
  const [pendingAction, setPendingAction] = useState<"publish" | null>(null);
  const isSavingDraftRef = useRef(false);

  const draftContentLoaded = !draftId || hydratedDraftId === draftId;

  const values = form.watch();
  const hasTitle = Boolean(values.title);
  const hasBody =
    Boolean(values.body) &&
    (Boolean(form.formState.dirtyFields.body) ||
      values.body !== BODY_PLACEHOLDER);
  const hasActions = values.actions.length > 0;
  const filledCount =
    (hasTitle ? 1 : 0) + (hasBody ? 1 : 0) + (hasActions ? 1 : 0);
  const canPublish =
    hasTitle && hasBody && hasActions && !!address && form.formState.isValid;

  const isBodyOverLimit = (values.body?.length ?? 0) > BODY_CHAR_LIMIT;
  const bodyOverLimitMessage = `Description is over the ${BODY_CHAR_LIMIT.toLocaleString()} character limit`;

  const stashPendingDraft = () => {
    try {
      sessionStorage.setItem(pendingDraftStashKey, JSON.stringify(values));
    } catch {
      // Best effort: a refused stash costs the round trip, not the draft.
    }
  };

  const handleShare = async () => {
    if (isBodyOverLimit) {
      showCustomToast(bodyOverLimitMessage, "error");
      return;
    }
    let id = currentDraftId;
    if (!id || form.formState.isDirty) {
      if (drafts.needsAuth) {
        stashPendingDraft();
        openLogin();
        return;
      }
      if (isSavingDraftRef.current) return;
      isSavingDraftRef.current = true;
      setIsSavingDraft(true);
      try {
        id = await drafts.saveDraft(
          {
            daoId,
            title: values.title,
            discussionUrl: values.discussionUrl ?? "",
            body: values.body,
            actions: values.actions,
          },
          currentDraftId,
        );
      } catch {
        id = "";
      } finally {
        isSavingDraftRef.current = false;
        setIsSavingDraft(false);
      }
      if (!id) {
        showCustomToast("Could not save draft", "error");
        return;
      }
      setCurrentDraftId(id);
      form.reset(values, { keepValues: true, keepDirty: false });
    }
    const copied = await copyDraftShareUrl(basePath, id);
    if (copied) {
      showCustomToast("URL copied to clipboard", "success");
    } else {
      showCustomToast("Could not copy link", "error");
    }
  };

  const handleEditCopy = () => {
    if (!draftContentLoaded) return;
    setSharedAuthor(undefined);
    setCurrentDraftId(undefined);
    hydratedDraftIdRef.current = undefined;
    setBodyVersion((v) => v + 1);
    router.push(`${basePath}/proposals/new?view=editor`);
  };

  const handlePreviewPublish = () => {
    if (!address) {
      setPendingAction("publish");
      promptWalletConnection();
      return;
    }
    handlePublishClick();
  };

  useEffect(() => {
    if (!address || pendingAction !== "publish") return;
    if (vp.isLoading || isLoadingThreshold || !draftContentLoaded) return;
    setPendingAction(null);
    handlePublishClick();
  }, [
    address,
    pendingAction,
    vp.isLoading,
    isLoadingThreshold,
    draftContentLoaded,
  ]);

  const handleSaveDraft = async (options?: { navigateToDrafts?: boolean }) => {
    if (isBodyOverLimit) {
      showCustomToast(bodyOverLimitMessage, "error");
      return;
    }
    if (drafts.needsAuth) {
      stashPendingDraft();
      openLogin();
      return;
    }
    if (isSavingDraftRef.current) return;
    isSavingDraftRef.current = true;
    setIsSavingDraft(true);
    try {
      const id = await drafts.saveDraft(
        {
          daoId,
          title: values.title,
          discussionUrl: values.discussionUrl ?? "",
          body: values.body,
          actions: values.actions,
        },
        currentDraftId,
      );
      if (!id) {
        showCustomToast("Could not save draft", "error");
        return;
      }
      setCurrentDraftId(id);
      form.reset(values, { keepValues: true, keepDirty: false });
      showCustomToast("Draft saved", "success");
      if (options?.navigateToDrafts !== false) {
        router.push(`${basePath}/proposals?tab=drafts`);
      }
    } catch {
      showCustomToast("Could not save draft", "error");
    } finally {
      isSavingDraftRef.current = false;
      setIsSavingDraft(false);
    }
  };

  const handlePublishClick = () => {
    if (!canPublish) return;
    if (!draftContentLoaded) return;
    if (vp.isLoading || isLoadingThreshold) {
      showCustomToast(
        "Still checking your voting power — try again in a moment.",
        "error",
      );
      return;
    }
    if (vp.votingPower < threshold) {
      void handleSaveDraft({ navigateToDrafts: false });
      setInsufficientOpen(true);
      return;
    }
    void publisher.publish(values, daoIdEnum);
    setPublishOpen(true);
  };

  useEffect(() => {
    if (publisher.isReceiptSuccess) {
      setPublishOpen(false);
      setSubmittedOpen(true);
    }
    if (publisher.isWriteError || publisher.isReceiptError) {
      setPublishOpen(false);
      setFailedOpen(true);
    }
  }, [
    publisher.isReceiptSuccess,
    publisher.isWriteError,
    publisher.isReceiptError,
  ]);

  const addAction = (
    action: EthTransferAction | ERC20TransferAction | CustomAction,
  ) => {
    actionsArray.append(toFormAction(action));
    revalidateActions();
  };

  const submitAction = (
    action: EthTransferAction | ERC20TransferAction | CustomAction,
  ) => {
    if (editActionIndex !== null) {
      actionsArray.update(editActionIndex, toFormAction(action));
      revalidateActions();
      setEditActionIndex(null);
    } else {
      addAction(action);
    }
  };

  const applyImportedProposal = (imported: ImportedProposal) => {
    const options = { shouldDirty: true, shouldValidate: true } as const;
    if (imported.title !== undefined) {
      form.setValue("title", imported.title, options);
    }
    if (imported.discussionUrl !== undefined) {
      form.setValue("discussionUrl", imported.discussionUrl, options);
    }
    if (imported.body !== undefined) {
      form.setValue("body", imported.body, options);
      setBodyVersion((v) => v + 1);
    }
    if (imported.actions !== undefined) {
      actionsArray.replace(imported.actions);
      form.setValue("actions", imported.actions, options);
    }
    showCustomToast("Proposal fields imported", "success");
  };

  const importAppliedRef = useRef(false);
  useEffect(() => {
    if (draftId || importAppliedRef.current) return;
    const imported = takeImportedProposal(daoId);
    if (!imported) return;
    importAppliedRef.current = true;
    applyImportedProposal(imported);
  }, [daoId, draftId]);

  const duplicateAction = (index: number) => {
    const source = form.getValues(`actions.${index}`);
    if (!source) return;
    actionsArray.insert(index + 1, cloneAction(source));
    revalidateActions();
  };

  const openEditForAction = (index: number) => {
    const action = values.actions[index];
    if (!action) return;
    setEditActionIndex(index);
    if (action.type === "custom") {
      setCustomOpen(true);
    } else {
      setTransferOpen(true);
    }
  };

  const editingAction =
    editActionIndex !== null ? values.actions[editActionIndex] : undefined;
  const editingTransfer =
    editingAction &&
    (editingAction.type === "eth-transfer" ||
      editingAction.type === "erc20-transfer")
      ? editingAction
      : undefined;
  const editingCustom =
    editingAction && editingAction.type === "custom"
      ? editingAction
      : undefined;

  const currentVpText = useMemo(() => {
    const decimals = daoConfig[daoIdEnum]?.decimals ?? 18;
    return formatUnits(vp.votingPower, decimals);
  }, [vp.votingPower, daoIdEnum]);

  const votingPowerDisplay = useMemo(() => {
    const numeric = Number(currentVpText);
    if (!Number.isFinite(numeric)) return "0";
    return formatNumberUserReadable(numeric, 0);
  }, [currentVpText]);

  const ownedDraft = draftId ? drafts.getDraft(draftId) : undefined;
  const ownsDraft = Boolean(ownedDraft);
  const isRecipient = Boolean(draftId) && !drafts.isLoading && !ownsDraft;
  const canShowEditor = !draftId || ownsDraft;
  const authorAddress = sharedAuthor ?? address ?? "";

  useEffect(() => {
    if (ownsDraft && draftId && currentDraftId !== draftId) {
      setCurrentDraftId(draftId);
    }
  }, [ownsDraft, draftId, currentDraftId]);

  const thresholdDisplay = thresholdFormatted
    ? formatNumberUserReadable(Number(thresholdFormatted), 0)
    : "—";

  const recipientState = getRecipientPublishState({
    address,
    votingPower: vp.votingPower,
    threshold,
  });

  const previewHelperCopy = isRecipient
    ? draftPreviewCopy(
        recipientState === "below-threshold"
          ? {
              role: "recipient",
              state: "below-threshold",
              thresholdDisplay,
              vpDisplay: votingPowerDisplay,
              tokenSymbol: daoIdEnum,
            }
          : { role: "recipient", state: recipientState },
      )
    : draftPreviewCopy({ role: "author" });

  useEffect(() => {
    if (isRecipient && draftContentLoaded && view !== "preview") {
      void setView("preview");
    }
  }, [isRecipient, draftContentLoaded, view, setView]);

  const proposalsListHref = `${basePath}/proposals`;

  const showInsufficientInline =
    Boolean(address) && vp.votingPower < threshold && !isLoadingThreshold;

  return (
    <FormProvider {...form}>
      <NavigationGuard
        isDirty={form.formState.isDirty}
        allowedPathname={`${basePath}/proposals/new`}
        onLeave={() => router.push(`${basePath}/proposals`)}
      />
      <nav
        aria-label="Breadcrumb"
        className="border-light-dark flex items-center gap-2 border-b px-5 py-3 lg:hidden"
      >
        <Link
          href={proposalsListHref}
          className="text-secondary hover:text-primary -ml-1 flex items-center gap-1 text-sm"
          aria-label="Back to proposals"
        >
          <ChevronLeft className="size-4" />
          Proposals
        </Link>
        <span className="text-secondary text-sm">/</span>
        <span className="text-primary text-sm">New Proposal</span>
      </nav>
      <div className="px-5 py-2 lg:hidden">
        <DraftViewToggle
          mode={view}
          onChange={(m) => void setView(m)}
          showEditor={canShowEditor}
          fullWidth
        />
      </div>
      <div className="text-primary bg-surface-background border-border-default sticky top-0 z-20 hidden h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b px-5 py-2 lg:flex">
        <div className="flex items-center">
          <DraftViewToggle
            mode={view}
            onChange={(m) => void setView(m)}
            showEditor={canShowEditor}
          />
        </div>
        <div className="flex items-center justify-end">
          {address ? (
            <div className="flex flex-col items-end">
              <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
                Your voting power
              </p>
              <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                {votingPowerDisplay}
              </p>
            </div>
          ) : (
            <ConnectWalletCustom label="Connect Wallet" />
          )}
        </div>
      </div>
      {view === "preview" ? (
        <DraftPreview
          daoId={daoId}
          daoIdEnum={daoIdEnum}
          title={values.title}
          discussionUrl={values.discussionUrl ?? ""}
          body={values.body}
          actions={values.actions}
          authorAddress={authorAddress}
          helperCopy={previewHelperCopy}
          secondaryAction={isRecipient ? "edit" : "copy-link"}
          onPublish={handlePreviewPublish}
          onCopyLink={handleShare}
          onEdit={handleEditCopy}
          editDisabled={!draftContentLoaded}
          isWhitelabelRoute={isWhitelabelRoute}
          publishDisabled={
            Boolean(address) &&
            (isLoadingThreshold ||
              !canPublish ||
              !draftContentLoaded ||
              (isRecipient && recipientState === "below-threshold"))
          }
        />
      ) : (
        <>
          <form
            className="animate-page-slide-in flex min-h-screen flex-col gap-6 px-5 pb-5 pt-5"
            noValidate
          >
            {showInsufficientInline && thresholdFormatted && (
              <InsufficientVPAlert
                threshold={formatNumberUserReadable(
                  Number(thresholdFormatted),
                  0,
                )}
                tokenSymbol={daoIdEnum}
              />
            )}

            <div className="flex w-full flex-col gap-1">
              <FormLabel isRequired>Title</FormLabel>
              <Input
                {...form.register("title")}
                placeholder="Proposal title"
                error={!!form.formState.errors.title}
              />
              {form.formState.errors.title && (
                <p className="text-error text-xs">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-1">
              <FormLabel>Discussion URL</FormLabel>
              <Input
                {...form.register("discussionUrl")}
                placeholder="https://discuss…"
                error={!!form.formState.errors.discussionUrl}
              />
              {form.formState.errors.discussionUrl ? (
                <p className="text-error text-xs">
                  {form.formState.errors.discussionUrl.message}
                </p>
              ) : (
                <p className="text-secondary text-xs">
                  Have you discussed this proposal on the forum first? Paste the
                  link here.
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-1">
              <FormLabel isRequired>Description</FormLabel>
              <BodyField version={bodyVersion} />
            </div>

            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between">
                <FormLabel isRequired>Actions</FormLabel>
                <span className="text-secondary text-xs">
                  {values.actions.length} action(s)
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {actionsArray.fields.length > 0 && (
                  <ActionsList
                    fields={actionsArray.fields}
                    onMove={(from, to) => {
                      actionsArray.move(from, to);
                      revalidateActions();
                    }}
                    onEditAction={openEditForAction}
                    onDuplicateAction={duplicateAction}
                    onDeleteAction={(i) => setDeleteActionIndex(i)}
                  />
                )}
                <ActionsPlaceholderCard
                  onAddTransfer={() => setTransferOpen(true)}
                  onAddCustom={() => setCustomOpen(true)}
                />
              </div>
            </div>
          </form>

          <ProposalFormNavBar
            filledCount={filledCount}
            totalCount={3}
            canPublish={canPublish}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublishClick}
            onShare={currentDraftId ? handleShare : undefined}
            isSavingDraft={isSavingDraft}
          />
        </>
      )}

      <AddTransferModal
        open={transferOpen}
        onOpenChange={(o) => {
          setTransferOpen(o);
          if (!o) setEditActionIndex(null);
        }}
        onSubmit={submitAction}
        initialValue={editingTransfer}
      />
      <AddCustomActionModal
        open={customOpen}
        onOpenChange={(o) => {
          setCustomOpen(o);
          if (!o) setEditActionIndex(null);
        }}
        daoId={daoId}
        onSubmit={submitAction}
        initialValue={editingCustom}
      />
      <DeleteActionModal
        open={deleteActionIndex !== null}
        onOpenChange={(o) => !o && setDeleteActionIndex(null)}
        onConfirm={() => {
          if (deleteActionIndex !== null) {
            actionsArray.remove(deleteActionIndex);
            revalidateActions();
          }
          setDeleteActionIndex(null);
        }}
      />
      <PublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        isReceiptLoading={publisher.isReceiptLoading}
        txHash={publisher.txHash}
        proposalTitle={values.title}
        actionsCount={values.actions.length}
        votingPower={currentVpText}
      />
      <ProposalSubmittedModal
        open={submittedOpen}
        onOpenChange={setSubmittedOpen}
        proposalId={publisher.proposalId?.toString() ?? null}
        onViewProposal={() => {
          if (publisher.proposalId != null) {
            router.push(
              `${basePath}/proposals/${publisher.proposalId.toString()}`,
            );
          }
        }}
      />
      <SubmissionFailedModal
        open={failedOpen}
        onOpenChange={setFailedOpen}
        onTryAgain={() => {
          publisher.reset();
          setFailedOpen(false);
          handlePublishClick();
        }}
        errorMessage={publisher.writeError?.message}
      />
      <InsufficientVPModal
        open={insufficientOpen}
        onOpenChange={setInsufficientOpen}
        currentVp={currentVpText}
        requiredVp={thresholdFormatted ?? "—"}
        onFindDelegate={() => router.push(`${basePath}/stakeholders`)}
        onViewDraft={() => {
          setInsufficientOpen(false);
          router.push(`${basePath}/proposals?tab=drafts`);
        }}
      />
    </FormProvider>
  );
};
