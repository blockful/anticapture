import { createRootPageOgImage } from "@/shared/og";

export const alt = "Anticapture Panel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const pageTitle = "Panel";

  return await createRootPageOgImage({
    pageTitle,
  });
}
