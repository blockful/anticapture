import type { ElementType } from "react";

import { cn } from "@/shared/utils/cn";

export type TypographyScale =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "caption"
  | "overline";

type ScaleMeta = {
  label: string;
  tailwindClass: string;
  description: string;
  weight: string;
  tag: ElementType;
};

const SCALE_META: Record<TypographyScale, ScaleMeta> = {
  display: {
    label: "Display",
    tailwindClass: "text-display",
    description: "48px / 52px / −2%",
    weight: "700",
    tag: "p",
  },
  h1: {
    label: "Heading 1",
    tailwindClass: "text-h1",
    description: "40px / 44px / −1.2%",
    weight: "700",
    tag: "h1",
  },
  h2: {
    label: "Heading 2",
    tailwindClass: "text-h2",
    description: "30px / 36px / −0.75%",
    weight: "600",
    tag: "h2",
  },
  h3: {
    label: "Heading 3",
    tailwindClass: "text-h3",
    description: "24px / 32px / −0.6%",
    weight: "600",
    tag: "h3",
  },
  h4: {
    label: "Heading 4",
    tailwindClass: "text-h4",
    description: "20px / 28px / −0.5%",
    weight: "600",
    tag: "h4",
  },
  h5: {
    label: "Heading 5",
    tailwindClass: "text-h5",
    description: "18px / 24px",
    weight: "500",
    tag: "h5",
  },
  h6: {
    label: "Heading 6",
    tailwindClass: "text-h6",
    description: "16px / 24px",
    weight: "500",
    tag: "h6",
  },
  "body-lg": {
    label: "Body Large",
    tailwindClass: "text-body-lg",
    description: "16px / 24px",
    weight: "400",
    tag: "p",
  },
  "body-md": {
    label: "Body Medium",
    tailwindClass: "text-body-md",
    description: "14px / 20px",
    weight: "400",
    tag: "p",
  },
  "body-sm": {
    label: "Body Small",
    tailwindClass: "text-body-sm",
    description: "12px / 16px",
    weight: "400",
    tag: "p",
  },
  caption: {
    label: "Caption",
    tailwindClass: "text-caption",
    description: "11px / 16px",
    weight: "400",
    tag: "p",
  },
  overline: {
    label: "Overline",
    tailwindClass: "text-overline",
    description: "11px / 16px / +8% tracking",
    weight: "500",
    tag: "p",
  },
};

const SAMPLE_TEXT: Partial<Record<TypographyScale, string>> = {
  display: "Governance at scale",
  h1: "Governance analytics",
  h2: "DAO health overview",
  h3: "Voting participation",
  h4: "Proposal breakdown",
  h5: "Token distribution",
  h6: "Recent activity",
  "body-lg":
    "Anticapture monitors on-chain governance to surface risk signals.",
  "body-md":
    "Track voter concentration, proposal history, and delegate influence across protocols.",
  "body-sm":
    "Data refreshed every 12 hours from on-chain sources. All values are approximate.",
  caption: "Last updated 2 hours ago",
  overline: "PROTOCOL OVERVIEW",
};

type TypographyRowProps = {
  scale: TypographyScale;
};

const TypographyRow = ({ scale }: TypographyRowProps) => {
  const meta = SCALE_META[scale];
  const Tag = meta.tag;
  const text = SAMPLE_TEXT[scale] ?? meta.label;

  return (
    <div className="border-border-default flex flex-col gap-1 border-b py-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-dimmed w-20 font-mono text-xs">{meta.label}</span>
        <span className="text-dimmed font-mono text-xs">
          {meta.description}
        </span>
        <span className="text-dimmed font-mono text-xs">w{meta.weight}</span>
        <code className="bg-surface-contrast text-secondary rounded px-1.5 py-0.5 font-mono text-[10px]">
          {meta.tailwindClass}
        </code>
      </div>
      <Tag
        className={cn(
          meta.tailwindClass,
          "text-primary",
          scale === "overline" && "font-medium uppercase tracking-[0.08em]",
        )}
        style={{ fontWeight: meta.weight }}
      >
        {text}
      </Tag>
    </div>
  );
};

export type TypographyShowcaseProps = {
  className?: string;
};

export const TypographyShowcase = ({ className }: TypographyShowcaseProps) => (
  <div className={cn("flex flex-col", className)}>
    {(Object.keys(SCALE_META) as TypographyScale[]).map((scale) => (
      <TypographyRow key={scale} scale={scale} />
    ))}
  </div>
);
