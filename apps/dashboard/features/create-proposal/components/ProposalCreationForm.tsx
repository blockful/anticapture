"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { getWhitelabelBasePath } from "@/shared/utils/whitelabel";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { BODY_PLACEHOLDER } from "@/features/create-proposal/constants";
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
import { ActionsList } from "@/features/create-proposal/components/actions/ActionsList";
import { ActionsPlaceholderCard } from "@/features/create-proposal/components/actions/ActionsPlaceholderCard";
import { AddTransferModal } from "@/features/create-proposal/components/modals/AddTransferModal";
import { AddCustomActionModal } from "@/features/create-proposal/components/modals/AddCustomActionModal";
import { DeleteActionModal } from "@/features/create-proposal/components/modals/DeleteActionModal";
import { PublishModal } from "@/features/create-proposal/components/modals/PublishModal";
import { ProposalSubmittedModal } from "@/features/create-proposal/components/modals/ProposalSubmittedModal";
import { SubmissionFailedModal } from "@/features/create-proposal/components/modals/SubmissionFailedModal";
import { InsufficientVPModal } from "@/features/create-proposal/components/modals/InsufficientVPModal";
import type {
  CustomAction,
  ERC20TransferAction,
  EthTransferAction,
  ProposalAction,
} from "@/features/create-proposal/types";

/**
 * Normalizes a ProposalAction for use in RHF form state.
 * The `Abi` type from viem is `readonly (AbiItem)[]`, but the Zod-inferred
 * form type expects a mutable `any[]`. We spread to get a mutable copy.
 */
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
  const governorAddress = daoConfig[daoIdEnum]?.daoOverview?.contracts
    ?.governor as `0x${string}` | undefined;
  const pathname = usePathname();
  const basePath = getWhitelabelBasePath({ daoId: daoIdEnum, pathname });
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams?.get("draftId") ?? undefined;
  const { address } = useAccount();
  const drafts = useDrafts(daoId, address);
  const vp = useProposalVotingPower(daoId, address, governorAddress);
  const threshold = useProposalThreshold(daoId);
  const publisher = usePublishProposal();

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(ProposalFormSchema),
    defaultValues: DEFAULTS,
    mode: "onChange",
  });
  const hasHydratedDraftRef = useRef(false);
  useEffect(() => {
    if (!draftId) return;
    if (hasHydratedDraftRef.current) return;
    const d = drafts.getDraft(draftId);
    if (!d) return;
    form.reset({
      title: d.title,
      discussionUrl: d.discussionUrl,
      body: d.body,
      actions: d.actions.map(toFormAction),
    });
    hasHydratedDraftRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, drafts.drafts]);

  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(
    draftId,
  );
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
    hasTitle &&
    hasBody &&
    hasActions &&
    !!address &&
    form.formState.isValid &&
    (values.body?.length ?? 0) <= 10_000;

  const handleSaveDraft = (options?: { navigateToDrafts?: boolean }) => {
    if (!address) {
      showCustomToast("Connect a wallet to save drafts", "error");
      return;
    }
    const id = drafts.saveDraft(
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
  };

  const handlePublishClick = () => {
    if (vp.hasEnough === false) {
      handleSaveDraft({ navigateToDrafts: false });
      setInsufficientOpen(true);
      return;
    }
    if (vp.hasEnough === null) {
      showCustomToast(
        vp.isLoading
          ? "Still checking your voting power — try again in a moment."
          : "Couldn't verify your voting power. Try again in a moment.",
        "error",
      );
      return;
    }
    if (!governorAddress) {
      showCustomToast("Governor not configured for this DAO", "error");
      return;
    }
    void publisher.publish(values, daoIdEnum);
    setPublishOpen(true);
  };

  // Transition publish → submitted/failed
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
    form.setValue("actions", [...values.actions, toFormAction(action)], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const submitAction = (
    action: EthTransferAction | ERC20TransferAction | CustomAction,
  ) => {
    if (editActionIndex !== null) {
      const next = [...values.actions];
      next[editActionIndex] = toFormAction(action);
      form.setValue("actions", next, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setEditActionIndex(null);
    } else {
      addAction(action);
    }
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

  const proposalsListHref = `${basePath}/proposals`;

  const showInsufficientInline =
    Boolean(address) &&
    vp.hasEnough === false &&
    !threshold.isLoading &&
    threshold.thresholdFormatted != null;

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
      {!isWhitelabelRoute && (
        <div className="text-primary bg-surface-background border-border-default sticky top-0 z-20 hidden h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b px-5 py-2 lg:flex">
          <div className="mx-auto flex w-full flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href={proposalsListHref}
                className="text-secondary hover:text-primary inline-flex items-center gap-2 text-[14px] font-normal leading-[20px] transition-colors"
              >
                <span>Proposals</span>
                <ChevronRight className="size-4" />
              </Link>
              <p className="text-primary text-[14px] font-medium leading-[20px]">
                New Proposal
              </p>
            </div>
            {address && (
              <div className="flex flex-col items-end">
                <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
                  Your voting power
                </p>
                <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
                  {votingPowerDisplay}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <form
        className="animate-page-slide-in flex min-h-screen flex-col gap-6 px-5 pb-5 pt-5"
        noValidate
      >
        {showInsufficientInline && threshold.thresholdFormatted && (
          <InsufficientVPAlert
            threshold={formatNumberUserReadable(
              Number(threshold.thresholdFormatted),
              0,
            )}
            tokenSymbol={daoConfig[daoIdEnum]?.name ?? ""}
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
          <BodyField />
        </div>

        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center justify-between">
            <FormLabel isRequired>Actions</FormLabel>
            <span className="text-secondary text-xs">
              {values.actions.length} action(s)
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {values.actions.length > 0 && (
              <ActionsList
                onEditAction={openEditForAction}
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
      />

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
            const next = [...values.actions];
            next.splice(deleteActionIndex, 1);
            form.setValue("actions", next, {
              shouldDirty: true,
              shouldValidate: true,
            });
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
        requiredVp={threshold.thresholdFormatted ?? "—"}
        onFindDelegate={() => router.push(`${basePath}/holders-and-delegates`)}
      />
    </FormProvider>
  );
};
