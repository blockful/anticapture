"use client";

import { useEffect, useState } from "react";

import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import {
  parseProposalJson,
  type ParsedProposalJson,
} from "@/features/create-proposal/utils/parseProposalJson";

interface ImportJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (values: ParsedProposalJson) => void;
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
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Start from a clean sheet on every open: a previous failed paste hanging
  // around next to a stale error reads as if the import already ran.
  useEffect(() => {
    if (!open) return;
    setText("");
    setError(null);
  }, [open]);

  const close = () => {
    setText("");
    setError(null);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    const result = parseProposalJson(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.value);
    close();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setText("");
          setError(null);
        }
        onOpenChange(o);
      }}
      title="Import JSON"
      description="Paste a proposal document to fill the form fields."
      cancelLabel="Cancel"
      confirmLabel="Apply"
      onCancel={close}
      onConfirm={handleConfirm}
      isConfirmDisabled={text.trim().length === 0}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FormLabel isRequired>Proposal JSON</FormLabel>
          <Textarea
            value={text}
            onChange={(e) => {
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
              Recipients take an address or ENS, and amounts are human-readable
              rather than wei.
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
                also <Code>tokenAddress</Code> and <Code>decimals</Code>.
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
