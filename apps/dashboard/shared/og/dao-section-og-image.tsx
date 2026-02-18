import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";
import { AnticaptureGlobeLogoSvg } from "./anticapture-globe-logo-svg";

const DAO_ICON_SIZE = 300;

/** Figma design tokens */
const OG_COLORS = {
  background: "#09090B",
  accent: "#EC762E",
} as const;

const OG_DIMENSIONS = { width: 1200, height: 630 } as const;

export interface DaoSectionOgImageProps {
  daoId: DaoIdEnum;
  sectionTitle: string;
}

/**
 * Renders the OG image per Figma design:
 * - Black background (#09090B)
 * - Orange accent (#EC762E)
 * - Corner brackets
 * - DAO logo (top-left)
 * - AnticaptureGlobeIcon (top-right)
 * - DAO name + section title (main content)
 */
export async function createDaoSectionOgImage({
  daoId,
  sectionTitle,
}: DaoSectionOgImageProps) {
  const config = daoConfig[daoId];
  const daoName = config.name;
  const daoDisplayName = `${daoName.split(" ")[0].toUpperCase()} DAO`;
  const DaoOgIcon = config.ogIcon;
  const daoOgIcon = <DaoOgIcon size={DAO_ICON_SIZE} />;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "space-between",
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

      {/* Top row: DAO logo + Anticapture */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <div
          style={{
            width: DAO_ICON_SIZE,
            height: DAO_ICON_SIZE,
            display: "flex",
          }}
        >
          {daoOgIcon}
        </div>
        <AnticaptureGlobeLogoSvg width={260} />
      </div>

      {/* Main content: DAO name + section title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: "auto",
        }}
      >
        <span
          style={{
            color: OG_COLORS.accent,
            fontFamily: "Roboto Mono, monospace",
            fontSize: 96,
            fontWeight: 500,
            letterSpacing: "0.1em",
            lineHeight: 1.24,
            textTransform: "uppercase",
          }}
        >
          {daoDisplayName}
        </span>
        <span
          style={{
            color: OG_COLORS.accent,
            fontFamily: "Roboto Mono, monospace",
            fontSize: 52,
            fontWeight: 400,
            letterSpacing: "0.1em",
            lineHeight: 1.24,
            textTransform: "uppercase",
          }}
        >
          {sectionTitle}
        </span>
      </div>
    </div>,
    {
      ...OG_DIMENSIONS,
      fonts: await loadLocalFonts(),
    },
  );
}

async function loadLocalFonts() {
  try {
    const fontsDir = join(process.cwd(), "public", "fonts");
    const [medium, regular] = await Promise.all([
      readFile(join(fontsDir, "RobotoMono-Medium.ttf")),
      readFile(join(fontsDir, "RobotoMono-Regular.ttf")),
    ]);
    return [
      {
        name: "Roboto Mono",
        data: medium,
        weight: 500 as const,
        style: "normal" as const,
      },
      {
        name: "Roboto Mono",
        data: regular,
        weight: 400 as const,
        style: "normal" as const,
      },
    ];
  } catch {
    return [];
  }
}
