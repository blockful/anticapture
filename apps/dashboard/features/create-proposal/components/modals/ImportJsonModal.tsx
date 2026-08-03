"use client";

import { Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { erc20Abi } from "viem";
import { usePublicClient } from "wagmi";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import { parseProposalJson } from "@/features/create-proposal/utils/parseProposalJson";
import {
  needsDecimalsLookup,
  resolveImportedDecimals,
} from "@/features/create-proposal/utils/resolveImportedDecimals";

export type ImportedProposal = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: ProposalFormValues["actions"];
};

interface ImportJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (values: ImportedProposal) => void;
}

/** Generous next to a real proposal, small enough not to lock up the tab. */
const MAX_UPLOAD_BYTES = 1_000_000;

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="text-primary font-mono">{children}</code>
);

// Keep the prose short: a line break right after a <code> swallows the space
// that follows it, so each entry has to fit on one line.
const Field = ({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) => (
  <li>
    <Code>{name}</Code> {children}
  </li>
);

export const ImportJsonModal = ({
  open,
  onOpenChange,
  onImport,
}: ImportJsonModalProps) => {
  const { daoId: daoIdParam } = useParams<{ daoId: string }>();
  const daoIdEnum = (daoIdParam ?? "").toUpperCase() as DaoIdEnum;
  const chainId = daoConfig[daoIdEnum]?.daoOverview?.chain?.id;
  const publicClient = usePublicClient(chainId ? { chainId } : undefined);

  const [text, setText] = useState("");
  // Tagged by scope: an upload failure belongs beside the file button, a
  // content failure beneath the textarea. One untagged slot painted the
  // textarea as invalid whenever a file was rejected, even though the pasted
  // document sitting in it was fine, and still the thing Apply would import.
  const [error, setError] = useState<{
    scope: "file" | "content";
    message: string;
  } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cancel, Escape and the close button all stay live while decimals are being
  // read, and the lookup keeps running after the sheet is gone. Every attempt
  // takes a ticket; a resolved lookup whose ticket is no longer current is
  // dropped, so a cancelled paste (or the previous one, after a reopen) can't
  // land on the form later.
  const attemptRef = useRef(0);

  // Start from a clean sheet on every open: a previous failed paste hanging
  // around next to a stale error reads as if the import already ran.
  useEffect(() => {
    if (!open) return;
    attemptRef.current += 1;
    setText("");
    setError(null);
    setIsResolving(false);
    setFileName(null);
  }, [open]);

  const close = () => {
    attemptRef.current += 1;
    setText("");
    setError(null);
    setIsResolving(false);
    setFileName(null);
    onOpenChange(false);
  };

  // A file lands in the textarea rather than importing straight away, so the
  // document is reviewable (and editable) before it touches the form.
  const loadFile = async (file: File) => {
    // Same ticket as an edit: replacing the content abandons any read in
    // flight, and a slow file can't land after the user moved on either.
    const attempt = ++attemptRef.current;

    if (file.size > MAX_UPLOAD_BYTES) {
      setError({
        scope: "file",
        message: "That file is too large to be a proposal document.",
      });
      return;
    }

    let contents: string;
    try {
      contents = await file.text();
    } catch {
      if (attemptRef.current !== attempt) return;
      setError({ scope: "file", message: "Couldn't read that file." });
      return;
    }

    if (attemptRef.current !== attempt) return;
    setText(contents);
    setFileName(file.name);
    setError(null);
  };

  const handleConfirm = async () => {
    const attempt = ++attemptRef.current;

    const result = parseProposalJson(text);
    if (!result.ok) {
      setError({ scope: "content", message: result.error });
      return;
    }

    const pending = result.value.actions;
    let actions: ProposalFormValues["actions"] | undefined;

    if (pending) {
      // Only ERC-20 transfers need the chain, so a document without one still
      // imports offline. Their decimals decide how the amount is scaled at
      // publish, so they come from the token rather than from the paste.
      const needsChain = needsDecimalsLookup(pending);
      if (needsChain && !publicClient) {
        setError({
          scope: "content",
          message:
            "No RPC client available to read the token decimals. Reconnect your wallet and try again.",
        });
        return;
      }

      if (needsChain) setIsResolving(true);
      let resolved;
      try {
        resolved = await resolveImportedDecimals(
          pending,
          async (tokenAddress) => {
            // Unreachable past the guard above, which only lets a document
            // through when there is a client to read every ERC-20 it carries.
            if (!publicClient) throw new Error("No RPC client");
            return Number(
              await publicClient.readContract({
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "decimals",
              }),
            );
          },
        );
      } finally {
        // Cleared before the staleness check below, so an abandoned lookup
        // can't leave Apply spinning on a paste the user has since edited.
        if (needsChain) setIsResolving(false);
      }

      // Closed, edited or superseded while the chain was answering: this
      // result is for a paste the user already walked away from.
      if (attemptRef.current !== attempt) return;

      if (!resolved.ok) {
        setError({ scope: "content", message: resolved.error });
        return;
      }
      actions = resolved.actions;
    }

    onImport({ ...result.value, actions });
    close();
  };

  return (
    <Modal
      open={open}
      // Routed through close() so dismissing with Escape or the X voids an
      // in-flight decimals lookup the same way Cancel does.
      onOpenChange={(o) => {
        if (!o) {
          close();
          return;
        }
        onOpenChange(o);
      }}
      title="Import JSON"
      description="Paste or upload a proposal document to fill the form fields."
      cancelLabel="Cancel"
      confirmLabel="Apply"
      onCancel={close}
      onConfirm={() => {
        void handleConfirm();
      }}
      isConfirmDisabled={text.trim().length === 0 || isResolving}
      isConfirmLoading={isResolving}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FormLabel isRequired>Proposal JSON</FormLabel>
          <Textarea
            value={text}
            onChange={(e) => {
              // Editing abandons whatever is being applied: the textarea stays
              // live during the decimals read, and without this the in-flight
              // lookup would still hold the current ticket and land the old
              // document on the form.
              attemptRef.current += 1;
              setText(e.target.value);
              setError(null);
              // The content is the user's now, not the file's.
              setFileName(null);
            }}
            // Without both handlers the browser navigates away to the dropped
            // file instead of handing it over.
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              e.preventDefault();
              void loadFile(file);
            }}
            placeholder={PROPOSAL_JSON_PLACEHOLDER}
            // Capped so a long paste (or a drag on the native resize grip)
            // can't push the footer off screen.
            className="max-h-64 min-h-44 resize-y overflow-y-auto font-mono text-xs"
            error={error?.scope === "content"}
            spellCheck={false}
            aria-label="Proposal JSON"
          />
          <div className="flex items-center gap-3 pt-0.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="size-3.5" />
              Upload .json
            </Button>
            {/* A rejected file says so here, next to the button that picked it.
                Reported on the textarea it would mark content that is still
                perfectly valid, and still applicable, as the thing at fault. */}
            {error?.scope === "file" ? (
              <span className="text-error truncate text-xs">
                {error.message}
              </span>
            ) : (
              <span className="text-secondary truncate text-xs">
                {fileName ?? "or drop one into the box above"}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void loadFile(file);
              // Cleared so picking the same file twice fires onChange again.
              e.target.value = "";
            }}
          />
          {error?.scope === "content" ? (
            <span className="text-error text-xs">{error.message}</span>
          ) : (
            <span className="text-secondary text-xs">
              Every field is optional, and only the ones present are replaced.
              Recipients take an address or ENS, amounts are human-readable
              rather than wei, and every figure has to be quoted so JSON
              can&apos;t round it.
            </span>
          )}
        </div>

        <ul className="text-secondary flex flex-col gap-1 text-xs">
          <Field name="title">the proposal title.</Field>
          <Field name="discussionUrl">
            an http(s) link to the forum thread.
          </Field>
          <Field name="body">the description, in markdown.</Field>
          <Field name="actions">
            one entry per action, keyed by <Code>type</Code>:
            <ul className="mt-1 flex flex-col gap-1 pl-4">
              <Field name="eth-transfer">
                <Code>recipient</Code> and <Code>amount</Code> in ETH.
              </Field>
              <Field name="erc20-transfer">
                also <Code>tokenAddress</Code>, whose <Code>decimals</Code> are
                read from the token.
              </Field>
              <Field name="custom">
                <Code>contractAddress</Code>, then either{" "}
                <Code>functionName</Code> with <Code>abi</Code> and{" "}
                <Code>args</Code>, or raw <Code>calldata</Code>.
              </Field>
            </ul>
          </Field>
        </ul>
      </div>
    </Modal>
  );
};
