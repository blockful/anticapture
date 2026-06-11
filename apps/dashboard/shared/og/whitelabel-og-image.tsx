import { ImageResponse } from "next/og";

import daoConfig from "@/shared/dao-config";
import { loadLocalFonts } from "@/shared/og/fonts";
import type { DaoIdEnum } from "@/shared/types/daos";

const LOGO_SIZE = 180;
const ART_SIZE = 760;
const OG_DIMENSIONS = { width: 1200, height: 630 } as const;

// Background is a light tint of the DAO brand color (≈24% brand over white),
// matching the DAO surface-2 tone from the Figma spec.
const BACKGROUND_TINT_RATIO = 0.24;

const mixWithWhite = (hex: string, ratio: number) => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16);
    return Math.round(channel * ratio + 255 * (1 - ratio));
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

const getTitleFontSize = (title: string) => {
  if (title.length <= 12) return 124;
  if (title.length <= 18) return 96;
  return 72;
};

export async function createWhitelabelOgImage(
  daoId: DaoIdEnum,
  pageTitle: string = "Governance",
  subtitle: string = "Gov Interface",
) {
  const config = daoConfig[daoId];
  const brandColor = config.color.svgColor;
  const background = mixWithWhite(brandColor, BACKGROUND_TINT_RATIO);
  const DaoOgIcon = config.ogIcon;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: background,
        padding: 40,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Oversized brand mark bleeding off the right edge */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          width: ART_SIZE,
          height: ART_SIZE,
          right: -120,
          top: (OG_DIMENSIONS.height - ART_SIZE) / 2,
        }}
      >
        <DaoOgIcon size={ART_SIZE} color={brandColor} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        {/* DAO logo, top-left */}
        <div
          style={{
            display: "flex",
            width: LOGO_SIZE,
            height: LOGO_SIZE,
          }}
        >
          <DaoOgIcon size={LOGO_SIZE} color={brandColor} />
        </div>

        {/* Fixed product label + current page title, bottom-left */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            color: brandColor,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              fontSize: 36,
              letterSpacing: "0.08em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </span>
          <span
            style={{
              fontSize: getTitleFontSize(pageTitle),
              lineHeight: 1.2,
            }}
          >
            {pageTitle}
          </span>
        </div>
      </div>
    </div>,
    {
      ...OG_DIMENSIONS,
      fonts: await loadLocalFonts(),
    },
  );
}
