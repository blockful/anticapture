"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { PROPOSAL_JSON_EXAMPLE } from "@/features/create-proposal/constants";
import {
  parseProposalJson,
  type ParsedProposalJson,
} from "@/features/create-proposal/utils/parseProposalJson";

interface ImportJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (values: ParsedProposalJson) => void;
}

const FIELD_DOCS: { name: string; description: string }[] = [
  { name: "title", description: "string, the proposal title." },
  {
    name: "discussionUrl",
    description: "string, an http(s) link to the forum thread.",
  },
  { name: "body", description: "string, the description, in markdown." },
  {
    name: "actions",
    description:
      'array, where each item is an "eth-transfer", "erc20-transfer" or "custom" action.',
  },
];

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
            placeholder='{ "title": "…", "body": "…", "actions": [] }'
            className="min-h-40 font-mono text-xs"
            error={Boolean(error)}
            spellCheck={false}
            aria-label="Proposal JSON"
          />
          {error ? (
            <span className="text-error text-xs">{error}</span>
          ) : (
            <span className="text-secondary text-xs">
              Only the fields present in the JSON are replaced. Everything else
              stays as you left it.
            </span>
          )}
        </div>

        <div className="border-border-default bg-surface-contrast/40 rounded-base flex flex-col gap-2 border p-3">
          <div className="flex items-center justify-between gap-2">
            <FormLabel>Expected format</FormLabel>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setText(PROPOSAL_JSON_EXAMPLE);
                setError(null);
              }}
            >
              Use example
            </Button>
          </div>
          <ul className="text-secondary flex flex-col gap-1 text-xs">
            {FIELD_DOCS.map((field) => (
              <li key={field.name}>
                <code className="text-primary font-mono">{field.name}</code>{" "}
                {field.description}
              </li>
            ))}
          </ul>
          <p className="text-secondary text-xs">
            Every field is optional. Amounts are human-readable (
            <code className="text-primary font-mono">&quot;1.5&quot;</code>, not
            wei), and an ERC-20 transfer must declare the token&apos;s{" "}
            <code className="text-primary font-mono">decimals</code>. A custom
            action needs either{" "}
            <code className="text-primary font-mono">functionName</code> plus
            its <code className="text-primary font-mono">abi</code>, or raw{" "}
            <code className="text-primary font-mono">calldata</code>.
          </p>
          <pre className="border-border-default bg-surface-default text-secondary rounded-base max-h-56 overflow-auto border p-2 font-mono text-[11px] leading-relaxed">
            {PROPOSAL_JSON_EXAMPLE}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
