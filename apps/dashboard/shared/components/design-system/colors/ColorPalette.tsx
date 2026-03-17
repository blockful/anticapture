import { cn } from "@/shared/utils/cn";

type ColorSwatch = {
  token: string;
  label: string;
  cssVar: string;
};

type ColorGroup = {
  title: string;
  swatches: ColorSwatch[];
};

const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Text & Icon Colors",
    swatches: [
      { token: "text-primary", label: "primary", cssVar: "--color-primary" },
      {
        token: "text-secondary",
        label: "secondary",
        cssVar: "--color-secondary",
      },
      { token: "text-dimmed", label: "dimmed", cssVar: "--color-dimmed" },
      {
        token: "text-inverted",
        label: "inverted",
        cssVar: "--color-inverted",
      },
      { token: "text-success", label: "success", cssVar: "--color-success" },
      { token: "text-warning", label: "warning", cssVar: "--color-warning" },
      { token: "text-error", label: "error", cssVar: "--color-error" },
      {
        token: "text-highlight",
        label: "highlight",
        cssVar: "--color-highlight",
      },
      { token: "text-link", label: "link", cssVar: "--color-link" },
    ],
  },
  {
    title: "Surface Colors",
    swatches: [
      {
        token: "bg-surface-background",
        label: "background",
        cssVar: "--color-surface-background",
      },
      {
        token: "bg-surface-default",
        label: "default",
        cssVar: "--color-surface-default",
      },
      {
        token: "bg-surface-contrast",
        label: "contrast",
        cssVar: "--color-surface-contrast",
      },
      {
        token: "bg-surface-hover",
        label: "hover",
        cssVar: "--color-surface-hover",
      },
      {
        token: "bg-surface-action",
        label: "action",
        cssVar: "--color-surface-action",
      },
      {
        token: "bg-surface-action-hover",
        label: "action-hover",
        cssVar: "--color-surface-action-hover",
      },
      {
        token: "bg-surface-destructive",
        label: "destructive",
        cssVar: "--color-surface-destructive",
      },
      {
        token: "bg-surface-disabled",
        label: "disabled",
        cssVar: "--color-surface-disabled",
      },
    ],
  },
  {
    title: "Opacity Surfaces",
    swatches: [
      {
        token: "bg-surface-opacity-success",
        label: "opacity-success",
        cssVar: "--color-surface-opacity-success",
      },
      {
        token: "bg-surface-opacity-warning",
        label: "opacity-warning",
        cssVar: "--color-surface-opacity-warning",
      },
      {
        token: "bg-surface-opacity-error",
        label: "opacity-error",
        cssVar: "--color-surface-opacity-error",
      },
      {
        token: "bg-surface-opacity-brand",
        label: "opacity-brand",
        cssVar: "--color-surface-opacity-brand",
      },
      {
        token: "bg-surface-opacity",
        label: "opacity",
        cssVar: "--color-surface-opacity",
      },
    ],
  },
  {
    title: "Solid Surfaces",
    swatches: [
      {
        token: "bg-surface-solid-success",
        label: "solid-success",
        cssVar: "--color-surface-solid-success",
      },
      {
        token: "bg-surface-solid-warning",
        label: "solid-warning",
        cssVar: "--color-surface-solid-warning",
      },
      {
        token: "bg-surface-solid-error",
        label: "solid-error",
        cssVar: "--color-surface-solid-error",
      },
      {
        token: "bg-surface-solid-brand",
        label: "solid-brand",
        cssVar: "--color-surface-solid-brand",
      },
    ],
  },
  {
    title: "Border Colors",
    swatches: [
      {
        token: "border-border-default",
        label: "default",
        cssVar: "--color-border-default",
      },
      {
        token: "border-border-contrast",
        label: "contrast",
        cssVar: "--color-border-contrast",
      },
      {
        token: "border-border-primary",
        label: "primary",
        cssVar: "--color-border-primary",
      },
      {
        token: "border-border-error",
        label: "error",
        cssVar: "--color-border-error",
      },
      {
        token: "border-border-warning",
        label: "warning",
        cssVar: "--color-border-warning",
      },
      {
        token: "border-border-success",
        label: "success",
        cssVar: "--color-border-success",
      },
    ],
  },
  {
    title: "Data Visualization",
    swatches: [
      {
        token: "bg-[var(--base-chart-1)]",
        label: "chart-1 (blue)",
        cssVar: "--base-chart-1",
      },
      {
        token: "bg-[var(--base-chart-2)]",
        label: "chart-2 (pink)",
        cssVar: "--base-chart-2",
      },
      {
        token: "bg-[var(--base-chart-3)]",
        label: "chart-3 (amber)",
        cssVar: "--base-chart-3",
      },
      {
        token: "bg-[var(--base-chart-4)]",
        label: "chart-4 (purple)",
        cssVar: "--base-chart-4",
      },
      {
        token: "bg-[var(--base-chart-5)]",
        label: "chart-5 (emerald)",
        cssVar: "--base-chart-5",
      },
      {
        token: "bg-[var(--base-chart-6)]",
        label: "chart-6 (cyan)",
        cssVar: "--base-chart-6",
      },
      {
        token: "bg-[var(--base-chart-7)]",
        label: "chart-7 (gold)",
        cssVar: "--base-chart-7",
      },
    ],
  },
];

type SwatchCardProps = {
  swatch: ColorSwatch;
  className?: string;
};

const SwatchCard = ({ swatch, className }: SwatchCardProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <div
      className="border-border-contrast h-12 w-full rounded-md border"
      style={{ background: `var(${swatch.cssVar})` }}
    />
    <div className="flex flex-col gap-0.5">
      <p className="text-primary font-mono text-xs font-medium">
        color.{swatch.label}
      </p>
      <p className="text-secondary font-mono text-[10px]">{swatch.cssVar}</p>
    </div>
  </div>
);

type ColorGroupProps = {
  group: ColorGroup;
};

const ColorGroupSection = ({ group }: ColorGroupProps) => (
  <div className="flex flex-col gap-4">
    <h3 className="text-primary text-sm font-semibold">{group.title}</h3>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {group.swatches.map((swatch) => (
        <SwatchCard key={swatch.cssVar} swatch={swatch} />
      ))}
    </div>
  </div>
);

export type ColorPaletteProps = {
  className?: string;
};

export const ColorPalette = ({ className }: ColorPaletteProps) => (
  <div className={cn("flex flex-col gap-10", className)}>
    {COLOR_GROUPS.map((group) => (
      <ColorGroupSection key={group.title} group={group} />
    ))}
  </div>
);
