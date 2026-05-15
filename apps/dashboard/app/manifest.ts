import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anticapture",
    short_name: "Anticapture",
    description:
      "DAO governance security platform that quantifies hostile takeover risk, detects governance capture, and tracks resilience metrics across major DAOs.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#EC762E",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  }
}
