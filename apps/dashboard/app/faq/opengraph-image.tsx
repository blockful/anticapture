import { createRootPageOgImage } from "@/shared/og";
import { ROOT_PAGE_OG_CONFIG } from "@/shared/og/root-page-config";

export const alt = "Anticapture FAQ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const pageTitle = ROOT_PAGE_OG_CONFIG["faq"] ?? "FAQ";

  return await createRootPageOgImage({
    pageTitle,
  });
}
