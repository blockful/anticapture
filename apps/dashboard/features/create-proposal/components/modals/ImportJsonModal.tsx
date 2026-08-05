"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Copy,
  Check,
  Upload,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { erc20Abi } from "viem";
import { usePublicClient } from "wagmi";

import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { JsonTextarea } from "@/features/create-proposal/components/JsonTextarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  PROPOSAL_IMPORT_SPEC,
  PROPOSAL_JSON_PLACEHOLDER,
} from "@/features/create-proposal/constants";
import { rangeOfLine } from "@/features/create-proposal/utils/scanJsonSource";
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import type { ImportedProposal } from "@/features/create-proposal/utils/importHandoff";
import {
  formatImportIssue,
  parseProposalJson,
  type ImportIssue,
} from "@/features/create-proposal/utils/parseProposalJson";
import {
  needsDecimalsLookup,
  resolveImportedDecimals,
} from "@/features/create-proposal/utils/resolveImportedDecimals";

interface ImportJsonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Takes the parsed document, and says whether it took it.
   *
   * Handing the values off can fail: the caller may be stashing them in browser
   * storage, which can be blocked or full. Returning false keeps the dialog open
   * on the document the author pasted, so nothing is lost while the caller
   * reports what went wrong.
   */
  onImport: (values: ImportedProposal) => boolean;
}

/** Generous next to a real proposal, small enough not to lock up the tab. */
const MAX_UPLOAD_BYTES = 1_000_000;

/**
 * Long enough that the reader stops typing before the row moves.
 *
 * Validation runs on every change, so there is no Validate button and no
 * validation-only step. Too short and the row flickers through the half-typed
 * states of a paste being edited; too long and it feels like it is not watching.
 */
const VALIDATE_DEBOUNCE_MS = 300;

/** `Valid · 3 actions`: the count is the one thing a reader can check at a
 *  glance against their own document. */
const describeValid = (actionCount: number | undefined): string =>
  actionCount === undefined
    ? "Valid"
    : `Valid · ${actionCount} action${actionCount === 1 ? "" : "s"}`;

/** One problem: `Line 7 · unquoted number 480000 must be quoted`. Several:
 *  `3 problems · first on line 7 · unquoted number 480000`. Naming the figure
 *  beats explaining why quoting matters, which does not fit on one line. */
const describeIssues = (issues: readonly ImportIssue[]): string => {
  const [first] = issues;
  if (!first) return "";

  const what = first.numberLiteral
    ? `unquoted number ${first.numberLiteral}`
    : formatImportIssue(first);

  if (issues.length === 1) {
    const detail = first.numberLiteral ? `${what} must be quoted` : what;
    return first.line ? `Line ${first.line} · ${detail}` : detail;
  }
  const where = first.line ? ` · first on line ${first.line}` : "";
  return `${issues.length} problems${where} · ${what}`;
};

/** What the status row is currently saying. */
type ValidationState =
  | { kind: "idle" }
  | { kind: "valid"; actionCount: number | undefined }
  | { kind: "invalid"; issues: ImportIssue[] };

/**
 * One line under the textarea, at a reserved height so nothing shifts when a real
 * message arrives.
 *
 * These icons draw their glyph with strokes and ship with the fill turned off, so
 * the colour has to go on the stroke. Binding the fill gives a solid square.
 */
const StatusRow = ({
  tone,
  icon: Icon,
  children,
}: {
  tone: string;
  icon: typeof CircleCheck;
  children: React.ReactNode;
}) => (
  <p className={cn("flex h-4 items-center gap-1.5 text-xs", tone)}>
    <Icon className="size-3.5 shrink-0 fill-none stroke-current" />
    <span className="truncate">{children}</span>
  </p>
);

const ValidationStatus = ({ state }: { state: ValidationState }) => {
  if (state.kind === "valid") {
    return (
      <StatusRow tone="text-success" icon={CircleCheck}>
        {describeValid(state.actionCount)}
      </StatusRow>
    );
  }

  if (state.kind === "invalid") {
    return (
      <StatusRow tone="text-error" icon={CircleAlert}>
        {describeIssues(state.issues)}
      </StatusRow>
    );
  }

  // "Not validated yet" reads as success on a quick scan, so it stays quiet.
  return (
    <StatusRow tone="text-secondary" icon={CircleDashed}>
      Not validated yet.
    </StatusRow>
  );
};

/**
 * A copy action that confirms itself by swapping its icon for a couple of
 * seconds.
 *
 * No toast: toasts inside a dialog stack badly and can be clipped, and the
 * confirmation belongs next to the thing that was clicked. The label never
 * changes either, so the button doesn't resize under the cursor.
 */
const CopyButton = ({ label, value }: { label: string; value: string }) => {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!hasCopied) return;
    const timer = setTimeout(() => setHasCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [hasCopied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be refused. This is a convenience, so a refusal
      // simply leaves the icon alone rather than raising an error the author
      // can do nothing about.
      return;
    }
    setHasCopied(true);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void copy()}
      className="shrink-0 gap-1.5"
    >
      {hasCopied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {label}
    </Button>
  );
};

export const ImportJsonModal = ({
  open,
  onOpenChange,
  onImport,
}: ImportJsonModalProps) => {
  const { daoId: daoIdParam } = useParams<{ daoId: string }>();
  const daoIdEnum = (daoIdParam ?? "").toUpperCase() as DaoIdEnum;
  const chainId = daoConfig[daoIdEnum]?.daoOverview?.chain?.id;
  const publicClient = usePublicClient(chainId ? { chainId } : undefined);

  // Starts holding the template so it can be copied and edited in place.
  const [text, setText] = useState(PROPOSAL_JSON_PLACEHOLDER);
  const [validation, setValidation] = useState<ValidationState>({
    kind: "idle",
  });

  /**
   * The template, still untouched.
   *
   * Treated as nothing having been entered yet, because that is what it is. The
   * template carries `"0x..."` where addresses go, so validating it would open
   * the dialog on an error about a document the author never wrote, and Import
   * would offer to act on it.
   */
  const isUntouched = text === PROPOSAL_JSON_PLACEHOLDER;
  // Tagged by scope: an upload failure belongs beside the file button, a content
  // failure beneath the textarea. One untagged slot painted the textarea as
  // invalid whenever a file was rejected, even though the pasted document sitting
  // in it was fine, and still the thing Import would take.
  const [error, setError] = useState<{
    scope: "file" | "content";
    message: string;
  } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cancel, Escape and the close button all stay live while decimals are being
  // read, and the lookup keeps running after the sheet is gone. Every attempt
  // takes a ticket; a resolved lookup whose ticket is no longer current is
  // dropped, so a cancelled paste (or the previous one, after a reopen) can't
  // land on the form later.
  const attemptRef = useRef(0);

  const clear = () => {
    setText(PROPOSAL_JSON_PLACEHOLDER);
    setError(null);
    setValidation({ kind: "idle" });
    setIsResolving(false);
    setFileName(null);
  };

  // Start from a clean sheet on every open: a previous failed paste hanging
  // around next to a stale error reads as if the import already ran.
  useEffect(() => {
    if (!open) return;
    attemptRef.current += 1;
    clear();
  }, [open]);

  // Validation on a debounce, and only here: the Import handler reads the same
  // parser, so the row and the button can't disagree about a document.
  useEffect(() => {
    if (text === PROPOSAL_JSON_PLACEHOLDER || !text.trim()) {
      setValidation({ kind: "idle" });
      return;
    }
    const timer = setTimeout(() => {
      const result = parseProposalJson(text);
      setValidation(
        result.ok
          ? { kind: "valid", actionCount: result.value.actions?.length }
          : { kind: "invalid", issues: result.issues },
      );
    }, VALIDATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const close = () => {
    attemptRef.current += 1;
    clear();
    onOpenChange(false);
  };

  const replaceText = (next: string) => {
    // Editing abandons whatever is being imported: the textarea stays live
    // during the decimals read, and without this the in-flight lookup would
    // still hold the current ticket and land the old document on the form.
    attemptRef.current += 1;
    setText(next);
    setError(null);
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

  /**
   * Selects the line the first problem is on, and scrolls it into view.
   *
   * MOD-14: Import stays enabled while the document is invalid, because a greyed
   * out button says nothing about what is wrong. Pressing it has to do something,
   * and the useful something is going to the problem.
   */
  const focusFirstIssue = (issues: readonly ImportIssue[]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const line = issues.find((issue) => issue.line)?.line;
    if (!line) return;
    const { start, end } = rangeOfLine(text, line);
    textarea.setSelectionRange(start, end);
    // Selecting alone doesn't scroll a long document to the selection.
    const lineHeight =
      textarea.scrollHeight / Math.max(1, text.split("\n").length);
    textarea.scrollTop = Math.max(0, (line - 2) * lineHeight);
  };

  const handleConfirm = async () => {
    const attempt = ++attemptRef.current;

    const result = parseProposalJson(text);
    if (!result.ok) {
      setValidation({ kind: "invalid", issues: result.issues });
      focusFirstIssue(result.issues);
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
        // can't leave Import spinning on a paste the user has since edited.
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

    // Closing clears the textarea, so it waits for the handoff to say it took
    // the document. A refused import leaves the dialog exactly as it was, with
    // the paste still in it and the caller's own message on screen, rather than
    // wiping a hand-written proposal that nothing received.
    if (!onImport({ ...result.value, actions })) return;
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
      title="Import proposal"
      description="Paste a proposal, or drop a file anywhere in this dialog."
      cancelLabel="Cancel"
      confirmLabel="Import"
      onCancel={close}
      onConfirm={() => {
        void handleConfirm();
      }}
      // Enabled while the document is invalid, on purpose: pressing it goes to
      // the first problem. Only an untouched template, an empty box and an
      // in-flight lookup disable it.
      isConfirmDisabled={isUntouched || text.trim().length === 0 || isResolving}
      isConfirmLoading={isResolving}
    >
      {/* Anywhere in the dialog, as the subtitle promises. Without both handlers
          the browser navigates away to the dropped file instead of handing it
          over. */}
      <div
        className="flex flex-col gap-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          e.preventDefault();
          void loadFile(file);
        }}
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            {/* No asterisk: it is the only field in the dialog, and the Import
                button's state already carries required-ness. */}
            <FormLabel>Proposal .json</FormLabel>
            <div className="flex items-center gap-2">
              {/* A rejected file says so here, next to the button that picked
                  it. Reported on the textarea it would mark content that is
                  still perfectly valid, and still importable, as the thing at
                  fault. */}
              {error?.scope === "file" && (
                <span className="text-error truncate text-xs">
                  {error.message}
                </span>
              )}
              {error?.scope !== "file" && fileName && (
                <span className="text-secondary max-w-40 truncate text-xs">
                  {fileName}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 gap-1.5"
              >
                <Upload className="size-3.5" />
                Upload .json
              </Button>
            </div>
          </div>
          <JsonTextarea
            ref={textareaRef}
            value={text}
            onChange={(next) => {
              replaceText(next);
              // The content is the user's now, not the file's.
              setFileName(null);
            }}
            placeholder={PROPOSAL_JSON_PLACEHOLDER}
            // Paste is the primary path, so the box is tall enough to read a
            // real document in.
            className="h-60"
            // Opted in here because the status row below cites line numbers.
            showLineNumbers
            hasError={
              error?.scope === "content" || validation.kind === "invalid"
            }
            // The line the status row is naming, marked in the gutter so the
            // number in the message and the number on screen agree.
            errorLine={
              validation.kind === "invalid"
                ? validation.issues.find((issue) => issue.line)?.line
                : undefined
            }
            ariaLabel="Proposal .json"
          />
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
            <StatusRow tone="text-error" icon={CircleAlert}>
              {error.message}
            </StatusRow>
          ) : (
            <ValidationStatus state={validation} />
          )}
        </div>

        {/* Two sentences, and only two. Anything validation catches is not
            pre-announced; these two survive because validation cannot catch
            them. The first is a consequence of correct input, and the second is
            undetectable, since "1000000000000000000" is a legal amount string
            and the parser has no way to know it was meant as wei. */}
        <div className="border-border-default rounded-base flex items-center justify-between gap-3 border p-3">
          <p className="text-secondary text-xs">
            Only fields present in the document are replaced.
            <br />
            Amounts are in ETH, not wei.
          </p>
          {/* No companion button for the template: it is the field's own value
              now, so it can be selected and copied where it sits. */}
          <CopyButton label="Copy spec for AI" value={PROPOSAL_IMPORT_SPEC} />
        </div>
      </div>
    </Modal>
  );
};
