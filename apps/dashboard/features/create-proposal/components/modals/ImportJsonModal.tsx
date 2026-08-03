"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { erc20Abi } from "viem";
import { usePublicClient } from "wagmi";

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
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

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
  }, [open]);

  const close = () => {
    attemptRef.current += 1;
    setText("");
    setError(null);
    setIsResolving(false);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    const attempt = ++attemptRef.current;

    const result = parseProposalJson(text);
    if (!result.ok) {
      setError(result.error);
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
        setError(
          "No RPC client available to read the token decimals. Reconnect your wallet and try again.",
        );
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
        setError(resolved.error);
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
      description="Paste a proposal document to fill the form fields."
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
            }}
            placeholder={PROPOSAL_JSON_PLACEHOLDER}
            // Capped so a long paste (or a drag on the native resize grip)
            // can't push the footer off screen.
            className="max-h-64 min-h-44 resize-y overflow-y-auto font-mono text-xs"
            error={Boolean(error)}
            spellCheck={false}
            aria-label="Proposal JSON"
          />
          {error ? (
            <span className="text-error text-xs">{error}</span>
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
