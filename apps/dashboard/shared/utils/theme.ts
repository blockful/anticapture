import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const LIGHT_THEME_VARIABLES = {
  "--base-background": "#ffffff",
  "--base-foreground": "#09090b",
  "--base-muted": "#f4f4f5",
  "--base-muted-foreground": "#52525b",
  "--base-card": "#ffffff",
  "--base-card-foreground": "#09090b",
  "--base-border": "#e4e4e7",
  "--base-input": "#e4e4e7",
  "--base-primary": "#18181b",
  "--base-primary-foreground": "#fafafa",
  "--base-secondary": "#f4f4f5",
  "--base-secondary-foreground": "#18181b",
  "--base-accent": "#f4f4f5",
  "--base-accent-foreground": "#18181b",
  "--base-destructive": "#ef4444",
  "--base-destructive-foreground": "#fafafa",
  "--base-ring": "#71717a",
  "--base-popover": "#ffffff",
  "--base-popover-foreground": "#09090b",
  "--base-sidebar": "#fafafa",
  "--base-sidebar-foreground": "#09090b",
  "--base-sidebar-primary": "#18181b",
  "--base-sidebar-primary-foreground": "#fafafa",
  "--base-sidebar-accent": "#f5f5f6",
  "--base-sidebar-accent-foreground": "#18181b",
  "--base-sidebar-border": "#e4e4e7",
  "--base-primary-opacity": "#18181b1f",
  "--base-primary-opacity-darker": "#fafafab2",
  "--base-success": "#15803d",
  "--base-success-opacity": "#15803d1f",
  "--base-warning": "#ca8a04",
  "--base-warning-opacity": "#ca8a041f",
  "--base-error": "#dc2626",
  "--base-error-opacity": "#dc26261f",
  "--base-destructive-hover": "#f87171",
  "--base-dimmed": "#a1a1aa",
  "--radius-base": "8px",
} satisfies Record<string, string>;

const withBrandColor = ({
  daoId,
  variables,
}: {
  daoId: DaoIdEnum;
  variables: Record<string, string>;
}) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const brandColor = daoConfig.color.svgColor;

  return {
    ...variables,
    "--base-brand": brandColor,
    "--base-brand-lighter": `color-mix(in srgb, ${brandColor} 70%, white)`,
    "--base-brand-opacity": `color-mix(in srgb, ${brandColor} 12%, transparent)`,
    "--color-tangerine": brandColor,
    "--color-link": brandColor,
    "--color-link-hover": brandColor,
    "--color-highlight": brandColor,
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
