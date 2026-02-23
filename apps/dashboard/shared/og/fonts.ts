import { readFile } from "node:fs/promises";
import { join } from "node:path";

const FONTS_DIR = join(process.cwd(), "public", "fonts");

const FONT_FILES = {
  medium: "RobotoMono-Medium.ttf",
  regular: "RobotoMono-Regular.ttf",
} as const;

async function loadFont(fileName: string): Promise<Buffer> {
  const path = join(FONTS_DIR, fileName);
  try {
    return await readFile(path);
  } catch (error) {
    console.warn(`[OG] Failed to load font "${fileName}" from ${path}:`, error);
    throw error;
  }
}

export async function loadLocalFonts() {
  try {
    const [medium, regular] = await Promise.all([
      loadFont(FONT_FILES.medium),
      loadFont(FONT_FILES.regular),
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
    console.warn("[OG] Falling back to system fonts for OG image rendering");
    return [];
  }
}
