import { Bell, ChevronRight, Code2 } from "lucide-react";
import type { ElementType } from "react";

import { BadgeIcon } from "@/shared/components/design-system/badges/badge-icon/BadgeIcon";
import { DefaultLink } from "@/shared/components/design-system/links/default-link/DefaultLink";

const DOCS_URL = "https://docs.anticapture.com";

type FeatureCard = {
  icon: ElementType;
  label: string;
  description: string;
  ctaLabel: string;
  href: string;
  openInNewTab: boolean;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: Bell,
    label: "Alerts",
    description:
      "Telegram, Slack, or webhook pings when a DAO you track moves: new proposals on-chain or Snapshot, vote reminders, delegation shifts, results. You choose the triggers.",
    ctaLabel: "Set up alerts",
    href: "/alerts",
    openInNewTab: false,
  },
  {
    icon: Code2,
    label: "API + MCP",
    description:
      "Your AI agent can read every number on this page for free, no key required. Plug Anticapture into Claude, Cursor, or anything that speaks MCP.",
    ctaLabel: "Connect your agent",
    href: DOCS_URL,
    openInNewTab: true,
  },
];

export const UseItNowSection = () => {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-primary text-alternative-sm tracking-alternative-sm font-mono font-medium uppercase leading-5">
        Use it now
      </h2>

      <div className="grid gap-2 lg:grid-cols-2">
        {FEATURE_CARDS.map(
          ({ icon, label, description, ctaLabel, href, openInNewTab }) => (
            <div
              key={label}
              className="bg-surface-default flex flex-col justify-between gap-4 p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <BadgeIcon
                    icon={icon}
                    variant="dimmed"
                    iconVariant="dimmed"
                  />
                  <h3 className="text-primary text-alternative-xs font-mono font-medium uppercase leading-4 tracking-wider">
                    {label}
                  </h3>
                </div>
                <p className="text-secondary text-sm font-normal leading-5">
                  {description}
                </p>
              </div>

              <DefaultLink
                href={href}
                variant="highlight"
                size="sm"
                openInNewTab={openInNewTab}
              >
                {ctaLabel}
                <ChevronRight className="size-4" />
              </DefaultLink>
            </div>
          ),
        )}
      </div>
    </div>
  );
};
