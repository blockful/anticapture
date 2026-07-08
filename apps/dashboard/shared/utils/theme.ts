import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const LIGHT_THEME_VARIABLES = {
  "--base-background": "#FAFAFA",
  "--base-foreground": "#09090B",
  "--base-muted": "#E4E4E7",
  "--base-muted-foreground": "#52525B",
  "--base-card": "#FAFAFA",
  "--base-card-foreground": "#09090B",
  "--base-popover": "#FAFAFA",
  "--base-popover-foreground": "#09090B",
  "--base-border": "#D4D4D8",
  "--base-input": "#E4E4E7",
  "--base-primary": "#18181B",
  "--base-primary-foreground": "#F4F4F5",
  "--base-secondary": "#E4E4E7",
  "--base-secondary-foreground": "#18181B",
  "--base-accent": "#F4F4F5",
  "--base-accent-foreground": "#18181B",
  "--base-destructive": "#B91C1C",
  "--base-ring": "#71717a",
  "--base-sidebar": "#f4f4f5",
  "--base-sidebar-foreground": "#09090b",
  "--base-sidebar-primary": "#18181b",
  "--base-sidebar-primary-foreground": "#f4f4f5",
  "--base-sidebar-accent": "#f5f5f6",
  "--base-sidebar-accent-foreground": "#18181b",
  "--base-sidebar-border": "#e4e4e7",
  "--base-primary-opacity": "#18181b1f",
  "--base-primary-opacity-darker": "#f4f4f5b2",
  "--base-success": "#15803d",
  "--base-success-opacity": "#15803d1f",
  "--base-warning": "#ca8a04",
  "--base-warning-opacity": "#ca8a041f",
  "--base-error": "#dc2626",
  "--base-error-opacity": "#dc26261f",
  "--base-destructive-hover": "#7F1D1D",
  "--base-dimmed": "#a1a1aa",
  "--radius-base": "8px",
} satisfies Record<string, string>;

const relativeLuminance = (hex: string) => {
  const value = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (hexA: string, hexB: string) => {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)]
    .sort((a, b) => b - a)
    .map((luminance) => luminance + 0.05);
  return lighter / darker;
};

// WCAG 3:1 minimum for non-text UI; below this against body text a brand color
// reads as plain text, so we lighten it for links/highlights.
const MIN_LINK_CONTRAST = 3;

const withBrandColor = ({
  daoId,
  variables,
}: {
  daoId: DaoIdEnum;
  variables: Record<string, string>;
}) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const brandColor = daoConfig.color.svgColor;
  // Near-black brand colors (e.g. Shutter navy) are indistinguishable from
  // body text, so text-level tokens get the lightened mix instead
  const textBrandColor =
    contrastRatio(brandColor, variables["--base-primary"]) < MIN_LINK_CONTRAST
      ? `color-mix(in srgb, ${brandColor} 70%, white)`
      : brandColor;

  return {
    ...variables,
    "--base-brand": brandColor,
    "--base-brand-lighter": `color-mix(in srgb, ${brandColor} 70%, white)`,
    "--base-brand-opacity": `color-mix(in srgb, ${brandColor} 12%, transparent)`,
    "--color-tangerine": brandColor,
    "--color-link": textBrandColor,
    "--color-link-hover": textBrandColor,
    "--color-highlight": textBrandColor,
    "--color-surface-solid-brand": brandColor,
    "--color-surface-opacity-brand": `color-mix(in srgb, ${brandColor} 12%, transparent)`,
    "--color-surface-action": brandColor,
    "--color-surface-action-hover": `color-mix(in srgb, ${brandColor} 80%, black)`,
  };
};

export const getThemeCSSVariables = (daoId: DaoIdEnum) => {
  return withBrandColor({
    daoId,
    variables: LIGHT_THEME_VARIABLES,
  });
};
