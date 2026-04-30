import { ImageResponse } from "next/og";

import daoConfig from "@/shared/dao-config";
import { loadLocalFonts } from "@/shared/og/fonts";
import type { DaoIdEnum } from "@/shared/types/daos";

const DAO_ICON_SIZE = 300;
const OG_DIMENSIONS = { width: 1200, height: 630 } as const;

export async function createWhitelabelOgImage(daoId: DaoIdEnum) {
  const config = daoConfig[daoId];
  const brandColor = config.color.svgColor;
  const background = "#FAFAFA";
  const DaoOgIcon = config.ogIcon;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        backgroundColor: background,
        padding: 48,
        position: "relative",
      }}
    >
      {/* Corner brackets */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 24,
          height: 24,
          borderLeft: `3px solid ${brandColor}`,
          borderTop: `3px solid ${brandColor}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 24,
          height: 24,
          borderRight: `3px solid ${brandColor}`,
          borderTop: `3px solid ${brandColor}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 24,
          height: 24,
          borderLeft: `3px solid ${brandColor}`,
          borderBottom: `3px solid ${brandColor}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 24,
          height: 24,
          borderRight: `3px solid ${brandColor}`,
          borderBottom: `3px solid ${brandColor}`,
        }}
      />

      <div
        style={{
          display: "flex",
          width: DAO_ICON_SIZE,
          height: DAO_ICON_SIZE,
        }}
      >
        <DaoOgIcon size={DAO_ICON_SIZE} color={brandColor} />
      </div>

      <span
        style={{
          color: brandColor,
          fontFamily: "Roboto Mono, monospace",
          fontSize: 72,
          fontWeight: 500,
          letterSpacing: "0.1em",
          lineHeight: 1.24,
          textTransform: "uppercase",
        }}
      >
        {"<governance>"}
      </span>
    </div>,
    {
      ...OG_DIMENSIONS,
      fonts: await loadLocalFonts(),
    },
  );
}
