import { Github, Mail } from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";

import { BadgeStatus } from "@/shared/components/design-system/badges";
import { TelegramIcon } from "@/shared/components/icons/TelegramIcon";
import { XIcon } from "@/shared/components/icons/XIcon";
import { cn } from "@/shared/utils/cn";

export interface EnsSocials {
  twitter?: string | null;
  telegram?: string | null;
  github?: string | null;
  email?: string | null;
}

interface SocialLink {
  key: string;
  icon: ElementType;
  label: string;
  href: string;
}

/**
 * ENS text records hold either a bare handle (`foo`, `@foo`) or, occasionally, a
 * full URL (`https://twitter.com/foo`). Reduce both to a bare handle so we can
 * safely build our own profile links instead of producing `https://x.com/https://...`.
 */
const normalizeHandle = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.includes("/")) {
    const segments = trimmed.split(/[?#]/)[0].split("/").filter(Boolean);
    return (segments[segments.length - 1] ?? "").replace(/^@/, "");
  }
  return trimmed.replace(/^@/, "");
};

const normalizeEmail = (value: string): string =>
  value.trim().replace(/^mailto:/i, "");

export const buildSocialLinks = (socials: EnsSocials): SocialLink[] => {
  const links: SocialLink[] = [];

  const twitter = socials.twitter ? normalizeHandle(socials.twitter) : "";
  if (twitter) {
    links.push({
      key: "twitter",
      icon: XIcon,
      label: `@${twitter}`,
      href: `https://x.com/${twitter}`,
    });
  }

  const telegram = socials.telegram ? normalizeHandle(socials.telegram) : "";
  if (telegram) {
    links.push({
      key: "telegram",
      icon: TelegramIcon,
      label: `@${telegram}`,
      href: `https://t.me/${telegram}`,
    });
  }

  const github = socials.github ? normalizeHandle(socials.github) : "";
  if (github) {
    links.push({
      key: "github",
      icon: Github,
      label: github,
      href: `https://github.com/${github}`,
    });
  }

  const email = socials.email ? normalizeEmail(socials.email) : "";
  if (email) {
    links.push({
      key: "email",
      icon: Mail,
      label: email,
      href: `mailto:${email}`,
    });
  }

  return links;
};

interface EnsSocialLinksProps {
  socials: EnsSocials;
  className?: string;
  /** Render compact icon-only links (no handle labels) for tight headers. */
  iconOnly?: boolean;
}

export const EnsSocialLinks = ({
  socials,
  className,
  iconOnly = false,
}: EnsSocialLinksProps) => {
  const links = buildSocialLinks(socials);

  if (links.length === 0) {
    return null;
  }

  if (iconOnly) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {links.map(({ key, icon: Icon, label, href }) => (
          <Link
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="bg-surface-hover hover:bg-surface-contrast text-primary flex size-6 items-center justify-center rounded-full transition-colors"
          >
            <Icon className="size-3.5 shrink-0" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {links.map(({ key, icon, label, href }) => (
        <Link
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80"
        >
          <BadgeStatus variant="secondary" iconVariant="secondary" icon={icon}>
            {label}
          </BadgeStatus>
        </Link>
      ))}
    </div>
  );
};
