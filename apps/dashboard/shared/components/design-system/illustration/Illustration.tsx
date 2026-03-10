import Image from "next/image";

import { cn } from "@/shared/utils/cn";

export type IllustrationName = "satellite" | "not-found" | "cookie" | "orbit";

type IllustrationMeta = {
  src: string;
  alt: string;
  width: number;
  height: number;
  context: string;
};

export const ILLUSTRATIONS: Record<IllustrationName, IllustrationMeta> = {
  satellite: {
    src: "/images/satellite.png",
    alt: "Satellite floating in space",
    width: 200,
    height: 200,
    context: "Empty states, no-data panels, loading placeholders",
  },
  "not-found": {
    src: "/images/bg-404.png",
    alt: "404 not found background",
    width: 400,
    height: 300,
    context: "404 error pages, broken route fallbacks",
  },
  cookie: {
    src: "/cookie.svg",
    alt: "Cookie consent illustration",
    width: 120,
    height: 120,
    context: "Cookie consent banner, privacy notices",
  },
  orbit: {
    src: "/images/orbit-ui-logo.png",
    alt: "Orbit UI component library logo",
    width: 120,
    height: 120,
    context: "Attribution, partner logos, UI references",
  },
};

export type IllustrationProps = {
  name: IllustrationName;
  className?: string;
  width?: number;
  height?: number;
};

export const Illustration = ({
  name,
  className,
  width,
  height,
}: IllustrationProps) => {
  const meta = ILLUSTRATIONS[name];

  return (
    <Image
      src={meta.src}
      alt={meta.alt}
      width={width ?? meta.width}
      height={height ?? meta.height}
      className={cn("object-contain", className)}
    />
  );
};
