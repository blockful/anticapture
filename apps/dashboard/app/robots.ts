import { getSiteUrl } from "@/shared/seo/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
