"use client";

import "@mdxeditor/editor/style.css";
import {
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  StrikeThroughSupSubToggles,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: "var(--color-link)", fontWeight: "600" },
  { tag: tags.link, color: "var(--color-link)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--color-link)" },
  { tag: tags.keyword, color: "var(--color-link)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "600" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.string, color: "var(--color-success)" },
  { tag: [tags.atom, tags.bool, tags.number], color: "var(--color-warning)" },
  { tag: tags.comment, color: "var(--color-secondary)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--color-secondary)" },
  { tag: tags.punctuation, color: "var(--color-secondary)" },
]);

const sourceViewExtensions = [syntaxHighlighting(markdownHighlightStyle)];

import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import {
  BODY_CHAR_LIMIT,
  BODY_WARNING_THRESHOLD,
} from "@/features/create-proposal/constants";
import type { ProposalFormValues } from "@/features/create-proposal/schema";

type Mode = "visual" | "markdown";

export const BodyField = () => {
  const { control, watch } = useFormContext<ProposalFormValues>();
  const body = watch("body") ?? "";
  const [mode, setMode] = useState<Mode>("visual");

  const counterColor =
    body.length > BODY_CHAR_LIMIT
      ? "text-error"
      : body.length >= BODY_WARNING_THRESHOLD
        ? "text-warning"
        : "text-secondary";

  return (
    <div className="flex w-full flex-col gap-1">
      <div
        className={[
          "border-border-contrast rounded-base flex w-full flex-col overflow-hidden border bg-transparent",
          "[&_.mdxeditor-toolbar]:rounded-base! [&_.mdxeditor-toolbar]:!mb-2 [&_.mdxeditor-toolbar]:!bg-transparent [&_.mdxeditor-toolbar]:!px-0 [&_.mdxeditor-toolbar]:!py-0",
          "[&_.mdxeditor-root-contenteditable]:max-h-100 md:[&_.mdxeditor-root-contenteditable]:max-h-150 [&_.mdxeditor-root-contenteditable]:overflow-y-auto",
          "[&_.cm-editor]:min-h-75 [&_.cm-editor]:max-h-100 [&_.cm-scroller]:min-h-75 [&_.cm-scroller]:max-h-100 md:[&_.cm-editor]:min-h-130 md:[&_.cm-editor]:max-h-150 md:[&_.cm-scroller]:min-h-130 md:[&_.cm-scroller]:max-h-150",
          // Markdown source view (CodeMirror) — match the dashboard theme
          "[&_.cm-editor]:bg-surface-background [&_.cm-editor]:text-primary",
          "[&_.cm-scroller]:bg-surface-background",
          "[&_.cm-content]:bg-surface-background [&_.cm-content]:text-primary [&_.cm-content]:caret-primary",
          "[&_.cm-gutters]:bg-surface-background [&_.cm-gutters]:text-secondary [&_.cm-gutters]:border-border-default",
          "[&_.cm-activeLineGutter]:bg-surface-contrast! [&_.cm-activeLineGutter]:text-primary [&_.cm-activeLine]:bg-surface-contrast!",
          "[&_.cm-cursor]:border-primary!",
          "[&_.cm-selectionBackground]:bg-surface-contrast! [&_.cm-content_::selection]:bg-surface-contrast!",
          "[&_.tok-heading]:text-link [&_.tok-heading]:font-semibold",
          "[&_.tok-keyword]:text-link [&_.tok-link]:text-link",
          "[&_.tok-string]:text-success [&_.tok-string2]:text-success",
          "[&_.tok-emphasis]:italic [&_.tok-strong]:font-semibold",
          "[&_.tok-comment]:text-secondary [&_.tok-comment]:italic",
          "[&_.tok-number]:text-warning [&_.tok-bool]:text-warning [&_.tok-atom]:text-warning",
          "[&_.tok-punctuation]:text-secondary [&_.tok-meta]:text-secondary",
          // Heading styles for Visual Editor content (mdxeditor content area)
          "[&_.mdxeditor-root-contenteditable_h1]:mb-3 [&_.mdxeditor-root-contenteditable_h1]:mt-4 [&_.mdxeditor-root-contenteditable_h1]:text-2xl [&_.mdxeditor-root-contenteditable_h1]:font-semibold",
          "[&_.mdxeditor-root-contenteditable_h2]:mb-2 [&_.mdxeditor-root-contenteditable_h2]:mt-4 [&_.mdxeditor-root-contenteditable_h2]:text-xl [&_.mdxeditor-root-contenteditable_h2]:font-semibold",
          "[&_.mdxeditor-root-contenteditable_h3]:mb-2 [&_.mdxeditor-root-contenteditable_h3]:mt-3 [&_.mdxeditor-root-contenteditable_h3]:text-lg [&_.mdxeditor-root-contenteditable_h3]:font-semibold",
          "[&_.mdxeditor-root-contenteditable_h4]:mb-1 [&_.mdxeditor-root-contenteditable_h4]:mt-3 [&_.mdxeditor-root-contenteditable_h4]:text-base [&_.mdxeditor-root-contenteditable_h4]:font-semibold",
          "[&_.mdxeditor-root-contenteditable_p]:my-2 [&_.mdxeditor-root-contenteditable_p]:text-sm",
          "[&_.mdxeditor-root-contenteditable_ul]:my-2 [&_.mdxeditor-root-contenteditable_ul]:ml-4 [&_.mdxeditor-root-contenteditable_ul]:list-disc",
          "[&_.mdxeditor-root-contenteditable_ol]:my-2 [&_.mdxeditor-root-contenteditable_ol]:ml-4 [&_.mdxeditor-root-contenteditable_ol]:list-decimal",
          "[&_.mdxeditor-root-contenteditable_blockquote]:border-border-default [&_.mdxeditor-root-contenteditable_blockquote]:text-secondary [&_.mdxeditor-root-contenteditable_blockquote]:border-l-2 [&_.mdxeditor-root-contenteditable_blockquote]:pl-3 [&_.mdxeditor-root-contenteditable_blockquote]:italic",
          "[&_.mdxeditor-root-contenteditable_a]:text-link [&_.mdxeditor-root-contenteditable_a]:underline",
          "[&_.mdxeditor-root-contenteditable_code]:bg-surface-contrast [&_.mdxeditor-root-contenteditable_code]:rounded [&_.mdxeditor-root-contenteditable_code]:px-1 [&_.mdxeditor-root-contenteditable_code]:py-0.5 [&_.mdxeditor-root-contenteditable_code]:text-xs",
          "[&_.mdxeditor-root-contenteditable_hr]:border-border-default [&_.mdxeditor-root-contenteditable_hr]:my-4",
        ].join(" ")}
      >
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <MDXEditor
              key={mode}
              markdown={field.value}
              onChange={(md) => field.onChange(md)}
              contentEditableClassName="!min-h-75 md:!min-h-130 max-w-none px-4 py-4 focus:outline-none"
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                tablePlugin(),
                markdownShortcutPlugin(),
                diffSourcePlugin({
                  viewMode: mode === "markdown" ? "source" : "rich-text",
                  codeMirrorExtensions: sourceViewExtensions,
                }),
                toolbarPlugin({
                  toolbarContents: () => (
                    <div className="bg-surface-default flex w-full flex-col gap-2 px-2 md:flex-row md:items-center md:justify-between">
                      <TabGroup
                        tabs={[
                          { label: "Visual Editor", value: "visual" },
                          { label: "Markdown", value: "markdown" },
                        ]}
                        activeTab={mode}
                        onTabChange={(v) => setMode(v as Mode)}
                        className="w-full border-b-0 md:w-auto"
                        size="md"
                      />
                      {mode === "visual" && (
                        <div className="order-2 flex flex-wrap items-center gap-0.5 md:order-none">
                          <BoldItalicUnderlineToggles
                            options={["Bold", "Italic"]}
                          />
                          <StrikeThroughSupSubToggles
                            options={["Strikethrough"]}
                          />
                          <Separator />
                          <InsertThematicBreak />
                          <Separator />
                          <ListsToggle options={["bullet", "number"]} />
                          <Separator />
                          <CreateLink />
                          <InsertTable />
                        </div>
                      )}
                    </div>
                  ),
                }),
              ]}
            />
          )}
        />
      </div>
      <p className={`${counterColor} text-xs`}>
        {body.length} / {BODY_CHAR_LIMIT.toLocaleString()}
      </p>
    </div>
  );
};
