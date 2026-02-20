import { ImageResponse } from "next/og";
import { AnticaptureGlobeLogoSvg } from "@/shared/og/anticapture-globe-logo-svg";
import { loadLocalFonts } from "@/shared/og/fonts";

/** Figma design tokens */
const OG_COLORS = {
  background: "#09090B",
  accent: "#EC762E",
} as const;

const OG_DIMENSIONS = { width: 1200, height: 630 } as const;

export interface RootPageOgImageProps {
  pageTitle: string;
}

/**
 * Renders the OG image for root pages:
 * - Black background (#09090B)
 * - Orange accent (#EC762E)
 * - Corner brackets
 * - AnticaptureGlobeIcon (top-right)
 * - Page title (main content)
 */
export async function createRootPageOgImage({
  pageTitle,
}: RootPageOgImageProps) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
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
          borderLeft: `3px solid ${OG_COLORS.accent}`,
          borderTop: `3px solid ${OG_COLORS.accent}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 24,
          height: 24,
          borderRight: `3px solid ${OG_COLORS.accent}`,
          borderTop: `3px solid ${OG_COLORS.accent}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 24,
          height: 24,
          borderLeft: `3px solid ${OG_COLORS.accent}`,
          borderBottom: `3px solid ${OG_COLORS.accent}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 24,
          height: 24,
          borderRight: `3px solid ${OG_COLORS.accent}`,
          borderBottom: `3px solid ${OG_COLORS.accent}`,
        }}
      />

      {/* Centered content: Logo and Title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <AnticaptureGlobeLogoSvg width={700} />
        <span
          style={{
            color: OG_COLORS.accent,
            fontFamily: "Roboto Mono, monospace",
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: "0.1em",
            lineHeight: 1.24,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {"<"}
          {pageTitle}
          {">"}
        </span>
      </div>
    </div>,
    {
      ...OG_DIMENSIONS,
      fonts: await loadLocalFonts(),
    },
  );
}
