import { createRootPageOgImage } from "@/shared/og";
import { ROOT_PAGE_OG_CONFIG } from "@/shared/og/root-page-config";

export const alt = "Anticapture Contact";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const pageTitle = ROOT_PAGE_OG_CONFIG["contact"] ?? "Contact";

  return await createRootPageOgImage({
    pageTitle,
  });
}
